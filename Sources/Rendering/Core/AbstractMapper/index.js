import macro from 'vtk.js/Sources/macros';

// ----------------------------------------------------------------------------
// vtkAbstractMapper methods
// ----------------------------------------------------------------------------

function vtkAbstractMapper(publicAPI, model) {
  model.classHierarchy.push('vtkAbstractMapper');
  publicAPI.update = () => {
    publicAPI.getInputData();
  };

  publicAPI.addClippingPlane = (plane) => {
    if (!plane.isA('vtkPlane')) {
      return false;
    }
    if (!model.clippingPlanes.includes(plane)) {
      model.clippingPlanes.push(plane);
      publicAPI.modified();
      return true;
    }
    return false;
  };

  publicAPI.getNumberOfClippingPlanes = () => model.clippingPlanes.length;

  publicAPI.removeAllClippingPlanes = () => {
    model.clippingPlanes.length = 0;
  };

  publicAPI.removeClippingPlane = (clippingPlane) => {
    const i = model.clippingPlanes.indexOf(clippingPlane);
    if (i === -1) {
      return false;
    }
    model.clippingPlanes.splice(i, 1);
    publicAPI.modified();
    return true;
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

  publicAPI.getClippingPlaneInDataCoords = (propMatrix, i, hnormal) => {
    const clipPlanes = model.clippingPlanes;
    const mat = propMatrix;

    if (clipPlanes) {
      const n = clipPlanes.length;
      if (i >= 0 && i < n) {
        // Get the plane
        const plane = clipPlanes[i];
        const normal = plane.getNormal();
        const origin = plane.getOrigin();

        // Compute the plane equation
        const v1 = normal[0];
        const v2 = normal[1];
        const v3 = normal[2];
        const v4 = -(v1 * origin[0] + v2 * origin[1] + v3 * origin[2]);

        // Transform normal from world to data coords
        hnormal[0] = v1 * mat[0] + v2 * mat[4] + v3 * mat[8] + v4 * mat[12];
        hnormal[1] = v1 * mat[1] + v2 * mat[5] + v3 * mat[9] + v4 * mat[13];
        hnormal[2] = v1 * mat[2] + v2 * mat[6] + v3 * mat[10] + v4 * mat[14];
        hnormal[3] = v1 * mat[3] + v2 * mat[7] + v3 * mat[11] + v4 * mat[15];

        return;
      }
    }
    macro.vtkErrorMacro(`Clipping plane index ${i} is out of range.`);
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
