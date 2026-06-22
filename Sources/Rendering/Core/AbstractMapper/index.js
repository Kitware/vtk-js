import { mat4, vec4 } from 'gl-matrix';
import macro from 'vtk.js/Sources/macros';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkAbstractMapper methods
// ----------------------------------------------------------------------------

const tmpClipMatrix = new Float64Array(16);
const tmpClipWorldPlane = new Float64Array(4);

function getClipPlaneEquation(plane, out) {
  const normal = plane.getNormalByReference();
  const origin = plane.getOriginByReference();

  out[0] = normal[0];
  out[1] = normal[1];
  out[2] = normal[2];
  out[3] = -(
    normal[0] * origin[0] +
    normal[1] * origin[1] +
    normal[2] * origin[2]
  );

  return out;
}

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
    if (model.clippingPlanes.length === 0) {
      return false;
    }
    model.clippingPlanes.length = 0;
    publicAPI.modified();
    return true;
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

  publicAPI.getClippingPlanesMTime = () => {
    let mtime = 0;
    for (let i = 0; i < model.clippingPlanes.length; i++) {
      mtime = Math.max(mtime, model.clippingPlanes[i].getMTime());
    }
    return mtime;
  };

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

  publicAPI.getClippingPlaneInCoords = (worldToCoords, i, hnormal) => {
    if (i < 0 || i >= model.clippingPlanes?.length) {
      vtkErrorMacro(`Clipping plane index ${i} is out of range.`);
      return undefined;
    }
    const outHNormal = hnormal || new Float64Array(4);
    getClipPlaneEquation(model.clippingPlanes[i], tmpClipWorldPlane);
    mat4.invert(tmpClipMatrix, worldToCoords);
    mat4.transpose(tmpClipMatrix, tmpClipMatrix);
    vec4.transformMat4(outHNormal, tmpClipWorldPlane, tmpClipMatrix);
    return outHNormal;
  };

  publicAPI.getClippingPlaneInDataCoords = (coordsToWorld, i, hnormal) => {
    const clipPlanes = model.clippingPlanes;

    if (clipPlanes) {
      const n = clipPlanes.length;
      if (i >= 0 && i < n) {
        getClipPlaneEquation(clipPlanes[i], tmpClipWorldPlane);
        vec4.transformMat4(hnormal, tmpClipWorldPlane, coordsToWorld);

        return;
      }
    }
    vtkErrorMacro(`Clipping plane index ${i} is out of range.`);
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
