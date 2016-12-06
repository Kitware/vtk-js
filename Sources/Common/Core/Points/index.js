import * as macro from '../../../macro';
import vtk from '../../../vtk';
import { VTK_DATATYPES } from '../DataArray/Constants';
import vtkDataArray from '../DataArray';
// ----------------------------------------------------------------------------
// vtkPoints methods
// ----------------------------------------------------------------------------

function vtkPoints(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPoints');

  publicAPI.getNumberOfPoints = () => model.data.getNumberOfTuples();

  publicAPI.setNumberOfPoints = (nbPoints, dimension = 3) => {
    if (publicAPI.getNumberOfPoints() !== nbPoints) {
      publicAPI.setData(vtkDataArray.newInstance({
        dataType: model.dataType,
        numberOfComponents: dimension,
        size: nbPoints * dimension,
      }));
    }
  };

  publicAPI.getBounds = () => {
    if (model.data.getNumberOfComponents() === 3) {
      return [].concat(
        publicAPI.data.getRange(0),
        publicAPI.data.getRange(1),
        publicAPI.data.getRange(2));
    }

    if (model.data.getNumberOfComponents() !== 2) {
      console.error('getBounds called on an array with components of ',
        model.data.getNumberOfComponents());
      return [1, -1, 1, -1, 1, -1];
    }

    return [].concat(
      publicAPI.data.getRange(0),
      publicAPI.data.getRange(1));
  };

  // Trigger the computation of bounds
  publicAPI.computeBounds = publicAPI.getBounds;

  // Overide mtime
  publicAPI.getMTime = () => Math.max(model.mtime, model.data.getMTime());

  /* eslint-disable no-use-before-define */
  publicAPI.shallowCopy = macro.shallowCopyBuilder(model, newInstance);
  /* eslint-enable no-use-before-define */
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // data: null,
  dataType: VTK_DATATYPES.Float64Array,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['data']);

  // Create dataArray if provided
  if (!model.data) {
    model.data = vtkDataArray.newInstance({ numberOfComponents: 3, empty: true });
  } else {
    model.data = vtk(model.data);
  }

  // Object specific methods
  vtkPoints(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPoints');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
