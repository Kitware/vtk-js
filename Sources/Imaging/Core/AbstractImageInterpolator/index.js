import macro from 'vtk.js/Sources/macros';
import Constants from 'vtk.js/Sources/Imaging/Core/AbstractImageInterpolator/Constants';
import { vtkInterpolationInfo } from './InterpolationInfo';

const { ImageBorderMode } = Constants;

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// vtkAbstractImageInterpolator methods
// ----------------------------------------------------------------------------

function vtkAbstractImageInterpolator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkAbstractImageInterpolator');

  publicAPI.initialize = (data) => {
    publicAPI.releaseData();
    model.scalars = data.getPointData().getScalars();
    model.spacing = data.getSpacing();
    model.origin = data.getOrigin();
    model.extent = data.getExtent();

    publicAPI.update();
  };
  publicAPI.releaseData = () => {
    model.scalars = null;
  };
  publicAPI.update = () => {
    if (!model.scalars) {
      model.interpolationInfo.pointer = null;
      model.interpolationInfo.numberOfComponents = 1;
      return;
    }
    model.interpolationInfo.extent = model.extent.slice();
    const supportSize = publicAPI.computeSupportSize(null);
    const kernelSize = Math.max(
      Math.max(supportSize[0], supportSize[1]),
      supportSize[2]
    );
    const minBound = Number.MIN_SAFE_INTEGER + kernelSize / 2;
    const maxBound = Number.MAX_SAFE_INTEGER - kernelSize / 2;
    for (let i = 0; i < 3; ++i) {
      const newTol = Math.max(
        0.5 * (model.extent[2 * i] === model.extent[2 * i + 1]),
        model.tolerance
      );
      model.structuredBounds[2 * i] = Math.max(
        model.extent[2 * i] - newTol,
        minBound
      );
      model.structuredBounds[2 * i + 1] = Math.min(
        model.extent[2 * i + 1] + newTol,
        maxBound
      );
    }
    const xdim = model.extent[1] - model.extent[0] + 1;
    const ydim = model.extent[3] - model.extent[2] + 1;

    const ncomp = model.scalars.getNumberOfComponents();
    model.interpolationInfo.increments[0] = ncomp;
    model.interpolationInfo.increments[1] =
      model.interpolationInfo.increments[0] * xdim;
    model.interpolationInfo.increments[2] =
      model.interpolationInfo.increments[1] * ydim;

    let component = model.componentOffset;
    component = component > 0 ? component : 0;
    component = component < ncomp ? component : ncomp - 1;

    const dataSize = 1; // scalars.getDataTypeSize()
    const inPtr = model.scalars.getData();
    model.interpolationInfo.pointer = inPtr.subarray(component * dataSize);

    model.interpolationInfo.scalarType = model.scalars.dataType;
    model.interpolationInfo.dataTypeSize = 1; // model.scalars.getElementComponentSize();
    model.interpolationInfo.numberOfComponents =
      publicAPI.computeNumberOfComponents(ncomp);

    model.interpolationInfo.borderMode = model.borderMode;
    publicAPI.internalUpdate();

    // TODO get functions
  };
  publicAPI.internalUpdate = () => {};
  publicAPI.interpolateXYZ = (x, y, z, component) => {
    let value = model.outValue;
    const point = [x, y, z];
    const p = [
      (point[0] - model.origin[0]) / model.spacing[0],
      (point[1] - model.origin[1]) / model.spacing[1],
      (point[2] - model.origin[2]) / model.spacing[2],
    ];
    if (publicAPI.checkBoundsIJK(p)) {
      const iinfo = { ...model.interpolationInfo };
      const ncomp = iinfo.increments[0] - model.componentOffset;
      const dataTypeSize = 1; // iinfo.dataTypeSize; // vtkAbstractArray::getDataTypeSize(iinfo.scalarType)

      let c = component > 0 ? component : 0;
      c = c < ncomp ? c : ncomp - 1;
      iinfo.pointer = model.interpolationInfo.pointer.subarray(
        dataTypeSize * c
      );
      iinfo.numberOfComponents = 1;

      const v = [value];
      publicAPI.interpolatePoint(iinfo, p, v);
      value = v[0];
    }
    return value;
  };

  publicAPI.interpolate = (point, value) => {
    const p = [
      (point[0] - model.origin[0]) / model.spacing[0],
      (point[1] - model.origin[1]) / model.spacing[1],
      (point[2] - model.origin[2]) / model.spacing[2],
    ];

    if (publicAPI.checkBoundsIJK(p)) {
      publicAPI.interpolatePoint(model.interpolationInfo, p, value);
      return true;
    }

    for (let i = 0; i < model.interpolationInfo.numberOfComponents; ++i) {
      value[i] = model.outValue;
    }
    return false;
  };

  publicAPI.computeNumberOfComponents = (inputCount) => {
    const component = Math.min(
      Math.max(model.componentOffset, 0),
      inputCount - 1
    );
    const count =
      model.componentCount < inputCount - component
        ? model.componentCount
        : inputCount - component;
    return count > 0 ? count : inputCount - component;
  };

  publicAPI.getNumberOfComponents = () =>
    model.interpolationInfo.numberOfComponents;

  publicAPI.interpolateIJK = (point, value) => {
    publicAPI.interpolatePoint(model.interpolationInfo, point, value);
  };

  publicAPI.checkBoundsIJK = (point) =>
    !(
      point[0] < model.structuredBounds[0] ||
      point[0] > model.structuredBounds[1] ||
      point[1] < model.structuredBounds[2] ||
      point[1] > model.structuredBounds[3] ||
      point[2] < model.structuredBounds[4] ||
      point[2] > model.structuredBounds[5]
    );

  publicAPI.computeSupportSize = null; // (matrix) => {};
  publicAPI.isSeparable = null;
  publicAPI.precomputeWeightsForExtent = (matrix, inExtent, checkExtent) => {};
  publicAPI.FreePrecomputedWeights = (weights) => {
    /*
    for (let k = 0; k < 3; ++k) {
      const step = weights.kernelSize[k];
      // TODO: check if ok
      weights.positions[k] += step * weights.weightExtent[2 * k];
      if (weights.weights[k]) {
        // TODO: check if ok
        weights.weights[k] += step * weights.weightExtent[2 * k];
      }
    }

    if (weights.workspace) {
      for (let i = 1; i < weights.kernelSize[1]; ++i) {
        // TODO
        ...
      }
    }
    */
  };
  publicAPI.interpolatePoint = (interpolationInfo, point, value) => {};
  publicAPI.interpolateRow = (weights, xIdx, yIdx, zIdx, value, n) => {};
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  outValue: 0,
  tolerance: Number.EPSILON,
  componentOffset: 0,
  componentCount: -1,
  borderMode: ImageBorderMode.CLAMP,
  slidingWindow: false,

  scalars: null,
  interpolationInfo: { ...vtkInterpolationInfo },
  interpolationFunc: null,
  rowInterpolationFunc: null,
  structuredBounds: [0, -1, 0, -1, 0, -1],
  spacing: null,
  origin: null,
  extent: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, [
    'outValue',
    'tolerance',
    'componentOffset',
    'componentCount',
    'borderMode',
    'slidingWindow',
  ]);
  macro.get(publicAPI, model, ['origin', 'spacing']);

  // Object specific methods
  vtkAbstractImageInterpolator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkAbstractImageInterpolator'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...Constants };
