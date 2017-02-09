import macro            from 'vtk.js/Sources/macro';
import vtkDataArray     from 'vtk.js/Sources/Common/Core/DataArray';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';
// ----------------------------------------------------------------------------
// vtkPoints methods
// ----------------------------------------------------------------------------

function vtkPoints(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPoints');

  // Forwarding methods
  publicAPI.getNumberOfPoints = publicAPI.getNumberOfTuples;

  publicAPI.setNumberOfPoints = (nbPoints, dimension = 3) => {
    if (publicAPI.getNumberOfPoints() !== nbPoints) {
      model.size = nbPoints * dimension;
      model.values = new window[model.dataType](model.size);
      publicAPI.setNumberOfComponents(dimension);
      publicAPI.modified();
    }
  };

  publicAPI.setPoint = (idx, ...xyz) => {
    const offset = idx * model.numberOfComponents;
    for (let i = 0; i < model.numberOfComponents; i++) {
      model.values[offset + i] = xyz[i];
    }
  };

  publicAPI.getPoint = publicAPI.getTuple;

  publicAPI.getBounds = () => {
    if (publicAPI.getNumberOfComponents() === 3) {
      return [].concat(
        publicAPI.getRange(0),
        publicAPI.getRange(1),
        publicAPI.getRange(2));
    }

    if (publicAPI.getNumberOfComponents() !== 2) {
      console.error('getBounds called on an array with components of ',
        publicAPI.getNumberOfComponents());
      return [1, -1, 1, -1, 1, -1];
    }

    return [].concat(
      publicAPI.getRange(0),
      publicAPI.getRange(1));
  };

  // Trigger the computation of bounds
  publicAPI.computeBounds = publicAPI.getBounds;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  empty: true,
  numberOfComponents: 3,
  dataType: VtkDataTypes.FLOAT,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkDataArray.extend(publicAPI, model, initialValues);
  vtkPoints(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPoints');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
