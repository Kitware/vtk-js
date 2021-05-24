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

const DEFAULT_VALUES = {
  bounds: [1, -1, 1, -1, 1, -1],
  center: [0, 0, 0],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);
  // Inheritance
  vtkAbstractMapper.extend(publicAPI, model, initialValues);

  if (!model.bounds) {
    vtkMath.uninitializeBounds(model.bounds);
  }

  if (!model.center) {
    model.center = [0.0, 0.0, 0.0];
  }

  vtkAbstractMapper3D(publicAPI, model);
}

// ----------------------------------------------------------------------------

export default { extend };
