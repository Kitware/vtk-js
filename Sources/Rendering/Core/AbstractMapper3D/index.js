import vtkAbstractMapper from 'vtk.js/Sources/Rendering/Core/AbstractMapper';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
// ----------------------------------------------------------------------------
// vtkAbstractMapper methods
// ----------------------------------------------------------------------------

function vtkAbstractMapper3D(publicAPI, model) {
  publicAPI.getBounds = () => 0;

  publicAPI.getBounds = (bounds) => {
    publicAPI.getBounds();
    for (let i = 0; i < 6; i++) {
      bounds[i] = model.bounds[i];
    }
  };

  publicAPI.getCenter = () => {
    publicAPI.getBounds();
    for (let i = 0; i < 3; i++) {
      model.center[i] = (model.bounds[2 * i + 1] + model.bounds[2 * i]) / 2.0;
    }
    return model.center.slice();
  };

  publicAPI.getLength = () => {
    let diff = 0.0;
    let l = 0.0;
    publicAPI.getBounds();
    for (let i = 0; i < 3; i++) {
      diff = model.bounds[2 * i + 1] - model.bounds[2 * i];
      l += diff * diff;
    }

    return Math.sqrt(l);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

function defaultValues(initialValues) {
  return {
    bounds: [1, -1, 1, -1, 1, -1],
    center: [0, 0, 0],
    ...initialValues,
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(initialValues, defaultValues(initialValues));
  // Inheritance
  vtkAbstractMapper.extend(publicAPI, model, initialValues);

  if (!initialValues.bounds) {
    vtkMath.uninitializeBounds(initialValues.bounds);
  }

  vtkAbstractMapper3D(publicAPI, model);
}

// ----------------------------------------------------------------------------

export default { extend };
