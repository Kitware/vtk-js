import macro from 'vtk.js/Sources/macro';

import vtkAbstractMapper from 'vtk.js/Sources/Rendering/Core/AbstractMapper';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
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

  publicAPI.getCenter = (...center) => {
    publicAPI.getBounds();
    for (let i = 0; i < 3; i++) {
      model.center[i] = (model.bounds[2 * i + 1] + model.bounds[2 * i]) / 2.0;
    }
    if (Array.isArray(center[0])) {
      center[0] = model.center.splice(0);
    }
    return model.center;
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
