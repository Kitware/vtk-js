import Constants from 'vtk.js/Sources/Rendering/Core/ImageMapper/Constants';
import macro from 'vtk.js/Sources/macro';
import vtkAbstractMapper from 'vtk.js/Sources/Rendering/Core/AbstractMapper';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';

import { vec3 } from 'gl-matrix';

const { vtkErrorMacro } = macro;
const { SlicingMode } = Constants;

// ----------------------------------------------------------------------------
// vtkImageMapper methods
// ----------------------------------------------------------------------------

function vtkImageMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkImageMapper');

  publicAPI.getSliceAtPosition = (pos) => {
    const image = publicAPI.getInputData();

    let pos3;
    if (pos.length === 3) {
      pos3 = pos;
    } else if (Number.isFinite(pos)) {
      const bds = image.getBounds();
      switch (model.currentSlicingMode) {
        case SlicingMode.X:
          pos3 = [pos, (bds[3] + bds[2]) / 2, (bds[5] + bds[4]) / 2];
          break;
        case SlicingMode.Y:
          pos3 = [(bds[1] + bds[0]) / 2, pos, (bds[5] + bds[4]) / 2];
          break;
        case SlicingMode.Z:
          pos3 = [(bds[1] + bds[0]) / 2, (bds[3] + bds[2]) / 2, pos];
          break;
        default:
          break;
      }
    }

    const ijk = [0, 0, 0];
    image.worldToIndex(pos3, ijk);

    const ex = image.getExtent();
    const { ijkMode } = publicAPI.getClosestIJKAxis();
    let slice = 0;
    switch (ijkMode) {
      case SlicingMode.I:
        slice = vtkMath.clampValue(ijk[0], ex[0], ex[1]);
        slice = Math.round(slice);
        break;
      case SlicingMode.J:
        slice = vtkMath.clampValue(ijk[1], ex[2], ex[3]);
        slice = Math.round(slice);
        break;
      case SlicingMode.K:
        slice = vtkMath.clampValue(ijk[2], ex[4], ex[5]);
        slice = Math.round(slice);
        break;
      default:
        return 0;
    }
    return slice;
  };

  publicAPI.setSliceFromCamera = (cam) => {
    const fp = cam.getFocalPoint();
    switch (model.currentSlicingMode) {
      case SlicingMode.I:
      case SlicingMode.J:
      case SlicingMode.K:
        {
          const slice = publicAPI.getSliceAtPosition(fp);
          console.log(slice);
          publicAPI.setSlice(slice);
        }
        break;
      case SlicingMode.X:
        publicAPI.setSlice(fp[0]);
        break;
      case SlicingMode.Y:
        publicAPI.setSlice(fp[1]);
        break;
      case SlicingMode.Z:
        publicAPI.setSlice(fp[2]);
        break;
      default:
        break;
    }
  };

  publicAPI.setSlice = (id, mode = model.currentSlicingMode) => {
    const mtime = publicAPI.getMTime();
    let changeDetected = false;

    if (model.currentSlicingMode !== mode) {
      model.currentSlicingMode = mode;
      changeDetected = true;
    }

    if (model.slice !== id) {
      model.slice = id;
      changeDetected = true;
    }

    if (changeDetected && mtime === publicAPI.getMTime()) {
      publicAPI.modified();
    }
  };

  publicAPI.setXSlice = (id) => publicAPI.setSlice(id, SlicingMode.X);

  publicAPI.setYSlice = (id) => publicAPI.setSlice(id, SlicingMode.Y);

  publicAPI.setZSlice = (id) => publicAPI.setSlice(id, SlicingMode.Z);

  publicAPI.setISlice = (id) => publicAPI.setSlice(id, SlicingMode.I);

  publicAPI.setJSlice = (id) => publicAPI.setSlice(id, SlicingMode.J);

  publicAPI.setKSlice = (id) => publicAPI.setSlice(id, SlicingMode.K);

  publicAPI.getSlicingModeNormal = () => {
    const out = [0, 0, 0];
    const a = publicAPI.getInputData().getDirection();
    const mat3 = [[a[0], a[1], a[2]], [a[3], a[4], a[5]], [a[6], a[7], a[8]]];

    switch (model.currentSlicingMode) {
      case SlicingMode.X:
        out[0] = 1;
        break;
      case SlicingMode.Y:
        out[1] = 1;
        break;
      case SlicingMode.Z:
        out[2] = 1;
        break;
      case SlicingMode.I:
        vtkMath.multiply3x3_vect3(mat3, [1, 0, 0], out);
        break;
      case SlicingMode.J:
        vtkMath.multiply3x3_vect3(mat3, [0, 1, 0], out);
        break;
      case SlicingMode.K:
        vtkMath.multiply3x3_vect3(mat3, [0, 0, 1], out);
        break;
      default:
        break;
    }
    return out;
  };

  publicAPI.getClosestIJKAxis = (t = 0.99) => {
    let inVec3;
    switch (model.currentSlicingMode) {
      case SlicingMode.X:
        inVec3 = [1, 0, 0];
        break;
      case SlicingMode.Y:
        inVec3 = [0, 1, 0];
        break;
      case SlicingMode.Z:
        inVec3 = [0, 0, 1];
        break;
      default:
        return {
          ijkMode: model.currentSlicingMode,
          flip: false,
        };
    }

    // Project vec3 onto direction cosines
    const out = [0, 0, 0];
    const a = publicAPI.getInputData().getDirection();
    const mat3 = [[a[0], a[3], a[6]], [a[1], a[4], a[7]], [a[2], a[5], a[8]]];
    vtkMath.multiply3x3_vect3(mat3, inVec3, out);

    // Using `t` as treshold for fuzzy search
    if (out[0] > t) {
      return { ijkMode: SlicingMode.I, flip: false };
    } else if (out[0] < -t) {
      return { ijkMode: SlicingMode.I, flip: true };
    } else if (out[1] > t) {
      return { ijkMode: SlicingMode.J, flip: false };
    } else if (out[1] < -t) {
      return { ijkMode: SlicingMode.J, flip: true };
    } else if (out[2] > t) {
      return { ijkMode: SlicingMode.K, flip: false };
    } else if (out[2] < -t) {
      return { ijkMode: SlicingMode.K, flip: true };
    }

    const axisLabel = 'IJKXYZ'[model.currentSlicingMode];
    vtkErrorMacro(
      `Error slicing along ${axisLabel} axis: ` +
        `not close enough to any IJK axis of the image data, ` +
        `necessitates slice reformat that is not yet implemented. ` +
        `You can switch your mapper to do IJK slicing instead.`
    );
    return { ijkMode: SlicingMode.NONE, flip: false };
  };

  publicAPI.getBounds = () => {
    const image = publicAPI.getInputData();
    if (!image) {
      return vtkMath.createUninitializedBounds();
    }
    if (!model.useCustomExtents) {
      return image.getBounds();
    }

    const ex = model.customDisplayExtent.slice();
    const { ijkMode } = publicAPI.getClosestIJKAxis();
    let nSlice = model.slice;
    if (ijkMode !== model.currentSlicingMode) {
      // If not IJK slicing, get the IJK slice from the XYZ position/slice
      nSlice = publicAPI.getSliceAtPosition(model.slice);
    }
    switch (ijkMode) {
      case SlicingMode.I:
        ex[0] = nSlice;
        ex[1] = nSlice;
        break;
      case SlicingMode.J:
        ex[2] = nSlice;
        ex[3] = nSlice;
        break;
      case SlicingMode.K:
        ex[4] = nSlice;
        ex[5] = nSlice;
        break;
      default:
        break;
    }

    return image.extentToBounds(ex);
  };

  publicAPI.getBoundsForSlice = (slice = model.slice, thickness = 0) => {
    const image = publicAPI.getInputData();
    if (!image) {
      return vtkMath.createUninitializedBounds();
    }
    const extent = image.getExtent();
    const { ijkMode } = publicAPI.getClosestIJKAxis();
    let nSlice = slice;
    if (ijkMode !== model.currentSlicingMode) {
      // If not IJK slicing, get the IJK slice from the XYZ position/slice
      nSlice = publicAPI.getSliceAtPosition(slice);
    }
    switch (ijkMode) {
      case SlicingMode.I:
        extent[0] = nSlice - thickness;
        extent[1] = nSlice + thickness;
        break;
      case SlicingMode.J:
        extent[2] = nSlice - thickness;
        extent[3] = nSlice + thickness;
        break;
      case SlicingMode.K:
        extent[4] = nSlice - thickness;
        extent[5] = nSlice + thickness;
        break;
      default:
        break;
    }
    return image.extentToBounds(extent);
  };

  publicAPI.getIsOpaque = () => true;

  publicAPI.intersectWithLineForPointPicking = (p1, p2) => {
    const imageData = publicAPI.getInputData();
    const extent = imageData.getExtent();

    // Slice origin
    const ijk = [extent[0], extent[2], extent[4]];
    const { ijkMode } = publicAPI.getClosestIJKAxis();
    let nSlice = model.slice;
    if (ijkMode !== model.currentSlicingMode) {
      // If not IJK slicing, get the IJK slice from the XYZ position/slice
      nSlice = publicAPI.getSliceAtPosition(nSlice);
    }
    ijk[ijkMode] += nSlice;
    const worldOrigin = [0, 0, 0];
    imageData.indexToWorld(ijk, worldOrigin);

    // Normal computation
    ijk[ijkMode] += 1;
    const worldNormal = [0, 0, 0];
    imageData.indexToWorld(ijk, worldNormal);
    worldNormal[0] -= worldOrigin[0];
    worldNormal[1] -= worldOrigin[1];
    worldNormal[2] -= worldOrigin[2];
    vec3.normalize(worldNormal, worldNormal);

    const intersect = vtkPlane.intersectWithLine(
      p1,
      p2,
      worldOrigin,
      worldNormal
    );
    if (intersect.intersection) {
      const point = intersect.x;
      const absoluteIJK = [0, 0, 0];
      imageData.worldToIndex(point, absoluteIJK);

      // Are we outside our actual extent/bounds
      if (
        absoluteIJK[0] < extent[0] ||
        absoluteIJK[0] > extent[1] ||
        absoluteIJK[1] < extent[2] ||
        absoluteIJK[1] > extent[3] ||
        absoluteIJK[2] < extent[4] ||
        absoluteIJK[2] > extent[5]
      ) {
        return null;
      }

      // Get closer integer ijk
      ijk[0] = Math.round(absoluteIJK[0]);
      ijk[1] = Math.round(absoluteIJK[1]);
      ijk[2] = Math.round(absoluteIJK[2]);

      return {
        ijk,
        absoluteIJK,
        point,
      };
    }
    return null;
  };

  publicAPI.intersectWithLineForCellPicking = (p1, p2) => {
    const imageData = publicAPI.getInputData();
    const extent = imageData.getExtent();

    // Slice origin
    const ijk = [extent[0], extent[2], extent[4]];
    const { ijkMode } = publicAPI.getClosestIJKAxis();
    let nSlice = model.slice;
    if (ijkMode !== model.currentSlicingMode) {
      // If not IJK slicing, get the IJK slice from the XYZ position/slice
      nSlice = publicAPI.getSliceAtPosition(nSlice);
    }
    ijk[ijkMode] += nSlice;
    const worldOrigin = [0, 0, 0];
    imageData.indexToWorld(ijk, worldOrigin);

    // Normal computation
    ijk[ijkMode] += 1;
    const worldNormal = [0, 0, 0];
    imageData.indexToWorld(ijk, worldNormal);
    worldNormal[0] -= worldOrigin[0];
    worldNormal[1] -= worldOrigin[1];
    worldNormal[2] -= worldOrigin[2];
    vec3.normalize(worldNormal, worldNormal);

    const intersect = vtkPlane.intersectWithLine(
      p1,
      p2,
      worldOrigin,
      worldNormal
    );
    if (intersect.intersection) {
      const point = intersect.x;
      const absoluteIJK = [0, 0, 0];
      imageData.worldToIndex(point, absoluteIJK);

      // Are we outside our actual extent/bounds
      if (
        absoluteIJK[0] < extent[0] ||
        absoluteIJK[0] > extent[1] ||
        absoluteIJK[1] < extent[2] ||
        absoluteIJK[1] > extent[3] ||
        absoluteIJK[2] < extent[4] ||
        absoluteIJK[2] > extent[5]
      ) {
        return null;
      }

      // Get closer integer ijk
      ijk[0] = Math.floor(absoluteIJK[0]);
      ijk[1] = Math.floor(absoluteIJK[1]);
      ijk[2] = Math.floor(absoluteIJK[2]);

      return {
        ijk,
        absoluteIJK,
        point,
      };
    }
    return null;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  displayExtent: [0, 0, 0, 0, 0, 0],
  customDisplayExtent: [0, 0, 0, 0],
  useCustomExtents: false,
  slice: 0,
  currentSlicingMode: SlicingMode.NONE,
  renderToRectangle: false,
  sliceAtFocalPoint: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  vtkAbstractMapper.extend(publicAPI, model, initialValues);

  macro.get(publicAPI, model, ['slice']);
  macro.setGet(publicAPI, model, [
    'currentSlicingMode',
    'useCustomExtents',
    'renderToRectangle',
    'sliceAtFocalPoint',
  ]);
  macro.setGetArray(publicAPI, model, ['customDisplayExtent'], 4);

  // Object methods
  vtkImageMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkImageMapper');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, Constants);
