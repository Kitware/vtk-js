import macro from 'vtk.js/Sources/macro';

// ----------------------------------------------------------------------------
// vtkAbstractMapper methods
// ----------------------------------------------------------------------------

function vtkAbstractMapper(publicAPI, model) {
  publicAPI.update = () => {
    publicAPI.getInputData();
  };

  publicAPI.addClippingPlane = (plane) => {
    if (plane.getClassName() !== 'vtkPlane') {
      return;
    }
    model.clippingPlanes.push(plane);
  };

  publicAPI.getNumberOfClippingPlanes = () => model.clippingPlanes.length;

  publicAPI.removeAllClippingPlanes = () => {
    model.clippingPlanes.length = 0;
  };

  publicAPI.removeClippingPlane = (i) => {
    if (i < 0 || i >= 6) {
      return;
    }
    model.clippingPlanes.splice(i, 1);
  };

  publicAPI.getClippingPlanes = () => model.clippingPlanes;

  publicAPI.setClippingPlanes = (planes) => {
    if (!planes) {
      return;
    }
    if (!Array.isArray(planes)) {
      publicAPI.addClippingPlane(planes);
    } else {
      const nbPlanes = planes.length;
      for (let i = 0; i < nbPlanes && i < 6; i++) {
        publicAPI.addClippingPlane(planes[i]);
      }
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  clippingPlanes: [],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);
  macro.algo(publicAPI, model, 1, 0);

  if (!model.clippingPlanes) {
    model.clippingPlanes = [];
  }

  vtkAbstractMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------
export default { extend };
