import Constants from 'vtk.js/Sources/Rendering/Core/ImageMapper/Constants';
import macro from 'vtk.js/Sources/macros';
import vtkAbstractImageMapper from 'vtk.js/Sources/Rendering/Core/AbstractImageMapper';
import * as pickingHelper from 'vtk.js/Sources/Rendering/Core/AbstractImageMapper/helper';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import CoincidentTopologyHelper from 'vtk.js/Sources/Rendering/Core/Mapper/CoincidentTopologyHelper';

const { staticOffsetAPI, otherStaticMethods } = CoincidentTopologyHelper;
const { vtkWarningMacro } = macro;
const { SlicingMode } = Constants;

// ----------------------------------------------------------------------------
// vtkImageMapper methods
// ----------------------------------------------------------------------------

function vtkImageMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkImageMapper');

  publicAPI.getSliceAtPosition = (pos) => {
    const image = publicAPI.getCurrentImage();

    let pos3;
    if (pos.length === 3) {
      pos3 = pos;
    } else if (Number.isFinite(pos)) {
      const bds = image.getBounds();
      switch (model.slicingMode) {
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
        break;
      case SlicingMode.J:
        slice = vtkMath.clampValue(ijk[1], ex[2], ex[3]);
        break;
      case SlicingMode.K:
        slice = vtkMath.clampValue(ijk[2], ex[4], ex[5]);
        break;
      default:
        return 0;
    }

    return slice;
  };

  publicAPI.setSliceFromCamera = (cam) => {
    const fp = cam.getFocalPoint();
    switch (model.slicingMode) {
      case SlicingMode.I:
      case SlicingMode.J:
      case SlicingMode.K:
        {
          const slice = publicAPI.getSliceAtPosition(fp);
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

  publicAPI.setXSlice = (id) => {
    publicAPI.setSlicingMode(SlicingMode.X);
    publicAPI.setSlice(id);
  };

  publicAPI.setYSlice = (id) => {
    publicAPI.setSlicingMode(SlicingMode.Y);
    publicAPI.setSlice(id);
  };

  publicAPI.setZSlice = (id) => {
    publicAPI.setSlicingMode(SlicingMode.Z);
    publicAPI.setSlice(id);
  };

  publicAPI.setISlice = (id) => {
    publicAPI.setSlicingMode(SlicingMode.I);
    publicAPI.setSlice(id);
  };

  publicAPI.setJSlice = (id) => {
    publicAPI.setSlicingMode(SlicingMode.J);
    publicAPI.setSlice(id);
  };

  publicAPI.setKSlice = (id) => {
    publicAPI.setSlicingMode(SlicingMode.K);
    publicAPI.setSlice(id);
  };

  publicAPI.getSlicingModeNormal = () => {
    const out = [0, 0, 0];
    const mat3 = publicAPI.getCurrentImage().getDirection();

    switch (model.slicingMode) {
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

  function computeClosestIJKAxis() {
    let inVec3;
    switch (model.slicingMode) {
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
        model.closestIJKAxis = {
          ijkMode: model.slicingMode,
          flip: false,
        };
        return;
    }

    // Project vec3 onto direction cosines
    const out = [0, 0, 0];
    // The direction matrix in vtkImageData is the indexToWorld rotation matrix
    // with a column-major data layout since it is stored as a WebGL matrix.
    // We need the worldToIndex rotation matrix for the projection, and it needs
    // to be in a row-major data layout to use vtkMath for operations.
    // To go from the indexToWorld column-major matrix to the worldToIndex
    // row-major matrix, we need to transpose it (column -> row) then inverse it.
    // However, that 3x3 matrix is a rotation matrix which is orthonormal, meaning
    // that its inverse is equal to its transpose. We therefore need to apply two
    // transpositions resulting in a no-op.
    const a = publicAPI.getCurrentImage().getDirection();
    vtkMath.multiply3x3_vect3(a, inVec3, out);

    let maxAbs = 0.0;
    let ijkMode = -1;
    let flip = false;
    for (let axis = 0; axis < out.length; ++axis) {
      const absValue = Math.abs(out[axis]);
      if (absValue > maxAbs) {
        maxAbs = absValue;
        flip = out[axis] < 0.0;
        ijkMode = axis;
      }
    }

    if (maxAbs !== 1.0) {
      const xyzLabel = 'IJKXYZ'[model.slicingMode];
      const ijkLabel = 'IJKXYZ'[ijkMode];
      vtkWarningMacro(
        `Unaccurate slicing along ${xyzLabel} axis which ` +
          `is not aligned with any IJK axis of the image data. ` +
          `Using ${ijkLabel} axis  as a fallback (${maxAbs}% aligned). ` +
          `Necessitates slice reformat that is not yet implemented.  ` +
          `You can switch the slicing mode on your mapper to do IJK slicing instead.`
      );
    }

    model.closestIJKAxis = { ijkMode, flip };
  }

  publicAPI.setSlicingMode = (mode) => {
    if (model.slicingMode === mode) {
      return;
    }
    model.slicingMode = mode;
    if (publicAPI.getCurrentImage()) {
      computeClosestIJKAxis();
    }
    publicAPI.modified();
  };

  publicAPI.getClosestIJKAxis = () => {
    if (
      (model.closestIJKAxis === undefined ||
        model.closestIJKAxis.ijkMode === SlicingMode.NONE) &&
      publicAPI.getCurrentImage()
    ) {
      computeClosestIJKAxis();
    }
    return model.closestIJKAxis;
  };

  publicAPI.getBounds = () => {
    const image = publicAPI.getCurrentImage();
    if (!image) {
      return vtkMath.createUninitializedBounds();
    }
    if (!model.useCustomExtents) {
      return image.getBounds();
    }

    const ex = model.customDisplayExtent.slice();
    const { ijkMode } = publicAPI.getClosestIJKAxis();
    let nSlice = model.slice;
    if (ijkMode !== model.slicingMode) {
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

  publicAPI.getBoundsForSlice = (slice = model.slice, halfThickness = 0) => {
    const image = publicAPI.getCurrentImage();
    if (!image) {
      return vtkMath.createUninitializedBounds();
    }
    const extent = image.getSpatialExtent();
    const { ijkMode } = publicAPI.getClosestIJKAxis();
    let nSlice = slice;
    if (ijkMode !== model.slicingMode) {
      // If not IJK slicing, get the IJK slice from the XYZ position/slice
      nSlice = publicAPI.getSliceAtPosition(slice);
    }
    switch (ijkMode) {
      case SlicingMode.I:
        extent[0] = nSlice - halfThickness;
        extent[1] = nSlice + halfThickness;
        break;
      case SlicingMode.J:
        extent[2] = nSlice - halfThickness;
        extent[3] = nSlice + halfThickness;
        break;
      case SlicingMode.K:
        extent[4] = nSlice - halfThickness;
        extent[5] = nSlice + halfThickness;
        break;
      default:
        break;
    }
    return image.extentToBounds(extent);
  };

  publicAPI.intersectWithLineForPointPicking = (p1, p2) =>
    pickingHelper.intersectWithLineForPointPicking(p1, p2, publicAPI);

  publicAPI.intersectWithLineForCellPicking = (p1, p2) =>
    pickingHelper.intersectWithLineForCellPicking(p1, p2, publicAPI);

  publicAPI.getCurrentImage = () => publicAPI.getInputData();
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  slicingMode: SlicingMode.NONE,
  closestIJKAxis: { ijkMode: SlicingMode.NONE, flip: false },
  renderToRectangle: false,
  sliceAtFocalPoint: false,
  preferSizeOverAccuracy: false, // Whether to use halfFloat representation of float, when it is inaccurate
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  vtkAbstractImageMapper.extend(publicAPI, model, initialValues);

  macro.get(publicAPI, model, ['slicingMode']);
  macro.setGet(publicAPI, model, [
    'closestIJKAxis',
    'renderToRectangle',
    'sliceAtFocalPoint',
    'preferSizeOverAccuracy',
  ]);

  CoincidentTopologyHelper.implementCoincidentTopologyMethods(publicAPI, model);

  // Object methods
  vtkImageMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkImageMapper');

// ----------------------------------------------------------------------------

export default {
  newInstance,
  extend,
  ...staticOffsetAPI,
  ...otherStaticMethods,
  ...Constants,
};
