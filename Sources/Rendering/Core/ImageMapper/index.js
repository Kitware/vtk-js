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

  publicAPI.setSliceFromCamera = (cam) => {
    const image = publicAPI.getInputData();
    const fp = cam.getFocalPoint();
    const idx = [];
    image.worldToIndex(fp, idx);

    let id = 0;
    const ex = image.getExtent();
    const { ijkMode } = publicAPI.getClosestIJKSlice();
    switch (ijkMode) {
      case SlicingMode.I:
        id = idx[0];
        id = Math.floor(id + 0.5);
        id = Math.min(id, ex[1]);
        id = Math.max(id, ex[0]);
        break;
      case SlicingMode.J:
        id = idx[1];
        id = Math.floor(id + 0.5);
        id = Math.min(id, ex[3]);
        id = Math.max(id, ex[2]);
        break;
      case SlicingMode.K:
        id = idx[2];
        id = Math.floor(id + 0.5);
        id = Math.min(id, ex[5]);
        id = Math.max(id, ex[4]);
        break;
      default:
        break;
    }
    publicAPI.setSlice(id);
  };

  publicAPI.setSlice = (id, mode = model.currentSlicingMode) => {
    const mtime = publicAPI.getMTime();
    let changeDetected = false;

    if (model.currentSlicingMode !== mode) {
      model.currentSlicingMode = mode;
      changeDetected = true;
    }

    if (model.slice !== id || changeDetected) {
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

  publicAPI.findClosestIJK = (inVec3, t = 0.99) => {
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
    return { ijkMode: SlicingMode.NONE, flip: false };
  };

  publicAPI.getClosestIJKSlice = () => {
    let ijkMode = publicAPI.getCurrentSlicingMode();
    let flip = false;
    switch (publicAPI.getCurrentSlicingMode()) {
      case SlicingMode.X:
        ({ ijkMode, flip } = publicAPI.findClosestIJK([1, 0, 0]));
        break;
      case SlicingMode.Y:
        ({ ijkMode, flip } = publicAPI.findClosestIJK([0, 1, 0]));
        break;
      case SlicingMode.Z:
        ({ ijkMode, flip } = publicAPI.findClosestIJK([0, 0, 1]));
        break;
      default:
        break;
    }

    if (ijkMode === SlicingMode.NONE) {
      const axisLabel = 'IJKXYZ'[publicAPI.getCurrentSlicingMode()];
      vtkErrorMacro(
        `Error slicing along ${axisLabel} axis: ` +
          `not close enough to any IJK axis of the image data, ` +
          `necessitates slice reformat that is not yet implemented. ` +
          `You can switch your mapper to do IJK slicing instead.`
      );
      return { ijkMode, nSlice: 0 };
    }

    let nSlice = model.slice;
    if (flip) {
      const image = publicAPI.getInputData();
      const extent = image.getExtent();
      switch (ijkMode) {
        case SlicingMode.I:
          nSlice = extent[1] - model.slice;
          break;
        case SlicingMode.J:
          nSlice = extent[3] - model.slice;
          break;
        case SlicingMode.K:
          nSlice = extent[5] - model.slice;
          break;
        default:
          break;
      }
    }
    return { ijkMode, nSlice };
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
    const { ijkMode, nSlice } = publicAPI.getClosestIJKSlice();
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

  publicAPI.getBoundsForSlice = (slice, thickness = 0) => {
    const image = publicAPI.getInputData();
    if (!image) {
      return vtkMath.createUninitializedBounds();
    }
    const extent = image.getExtent();
    const { ijkMode, nSlice } = publicAPI.getClosestIJKSlice();
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
    const { ijkMode, nSlice } = publicAPI.getClosestIJKSlice();
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
    const { ijkMode, nSlice } = publicAPI.getClosestIJKSlice();
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
