import { vec3, quat, mat4 } from 'gl-matrix';

import macro          from 'vtk.js/Sources/macro';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import vtkMath        from 'vtk.js/Sources/Common/Core/Math';
import vtkProp        from 'vtk.js/Sources/Rendering/Core/Prop';

function notImplemented(method) {
  return () => macro.vtkErrorMacro(`vtkProp3D::${method} - NOT IMPLEMENTED`);
}

// ----------------------------------------------------------------------------
// vtkProp3D methods
// ----------------------------------------------------------------------------

function vtkProp3D(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkProp3D');

  // Capture 'parentClass' api for internal use
  const superClass = Object.assign({}, publicAPI);

  publicAPI.getMTime = () => {
    const m1 = superClass.getMTime();
    const m2 =
      publicAPI.getUserMatrixMTime();
    if (m1 > m2) {
      return m1;
    }
    return m2;
  };

  publicAPI.getUserMatrixMTime = () =>
    (model.userMatrix ? model.userMatrix.getMTime() : 0);

  publicAPI.addPosition = (deltaXYZ) => {
    model.position = model.position.map((value, index) => value + deltaXYZ[index]);
    publicAPI.modified();
  };

  publicAPI.getOrientationWXYZ = () => {
    const q = quat.create();
    mat4.getRotation(q, model.rotation);
    const oaxis = vec3.create();
    const w = quat.getAxisAngle(oaxis, q);
    return [vtkMath.degreesFromRadians(w), oaxis[0], oaxis[1], oaxis[2]];
  };

  // FIXME
  publicAPI.addOrientation = notImplemented('addOrientation');
  publicAPI.getOrientation = notImplemented('getOrientation');
  publicAPI.setOrientation = notImplemented('setOrientation');


  publicAPI.rotateX = (val) => {
    if (val !== 0.0) {
      model.isIdentity = false;
    }
    mat4.rotateX(model.rotation, model.rotation,
      vtkMath.radiansFromDegrees(val));
  };

  publicAPI.rotateY = (val) => {
    if (val !== 0.0) {
      model.isIdentity = false;
    }
    mat4.rotateY(model.rotation, model.rotation,
      vtkMath.radiansFromDegrees(val));
  };

  publicAPI.rotateZ = (val) => {
    if (val !== 0.0) {
      model.isIdentity = false;
    }
    mat4.rotateZ(model.rotation, model.rotation,
      vtkMath.radiansFromDegrees(val));
  };

  publicAPI.rotateWXYZ = (degrees, x, y, z) => {
    if (degrees === 0.0 || (x === 0.0 && y === 0.0 && z === 0.0)) {
      return;
    }

    // convert to radians
    const angle = vtkMath.radiansFromDegrees(degrees);

    const q = quat.create();
    quat.setAxisAngle(q, [x, y, z], angle);

    const quatMat = mat4.create();
    mat4.fromQuat(quatMat, q);
    mat4.multiply(model.rotation, model.rotation, quatMat);
  };

  publicAPI.SetUserTransform = notImplemented('SetUserTransform');
  publicAPI.SetUserMatrix = notImplemented('SetUserMatrix');

  publicAPI.getMatrix = () => {
    publicAPI.computeMatrix();
    return model.matrix;
  };

  publicAPI.computeMatrix = () => {
    if (model.isIdentity) {
      return;
    }

    // check whether or not need to rebuild the matrix
    if (publicAPI.getMTime() > model.matrixMTime.getMTime()) {
      mat4.identity(model.matrix);
      mat4.translate(model.matrix, model.matrix, model.origin);
      mat4.translate(model.matrix, model.matrix, model.position);
      mat4.multiply(model.matrix, model.matrix, model.rotation);
      mat4.scale(model.matrix, model.matrix, model.scale);
      mat4.translate(model.matrix, model.matrix, [-model.origin[0], -model.origin[1], -model.origin[2]]);
      mat4.transpose(model.matrix, model.matrix);

      model.matrixMTime.modified();
    }
  };

  publicAPI.getCenter = () => vtkBoundingBox.getCenter(model.bounds);
  publicAPI.getLength = () => vtkBoundingBox.getLength(model.bounds);
  publicAPI.getXRange = () => vtkBoundingBox.getXRange(model.bounds);
  publicAPI.getYRange = () => vtkBoundingBox.getYRange(model.bounds);
  publicAPI.getZRange = () => vtkBoundingBox.getZRange(model.bounds);

  publicAPI.pokeMatrix = notImplemented('pokeMatrix');
  publicAPI.getUserMatrix = notImplemented('GetUserMatrix');

  function updateIdentityFlag() {
    let noChange = true;
    [model.origin, model.position].forEach((array) => {
      if (noChange && array.filter(v => v !== 0).length) {
        model.isIdentity = false;
        noChange = false;
      }
    });

    // if (model.userMatrix || model.userTransform) {
    //   model.isIdentity = false;
    //   noChange = false;
    // }

    if (noChange && model.scale.filter(v => v !== 1).length) {
      model.isIdentity = false;
    }
  }

  publicAPI.onModified(updateIdentityFlag);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  origin: [0, 0, 0],
  position: [0, 0, 0],
  rotation: null,
  scale: [1, 1, 1],
  bounds: [1, -1, 1, -1, 1, -1],

  userMatrix: null,
  userTransform: null,

  cachedProp3D: null,
  isIdentity: true,
  matrixMTime: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkProp.extend(publicAPI, model, initialValues);

  model.matrixMTime = {};
  macro.obj(model.matrixMTime);

  // Build VTK API
  macro.get(publicAPI, model, [
    'bounds',
    'isIdentity',
  ]);
  macro.setGetArray(publicAPI, model, [
    'origin',
    'position',
    'orientation',
    'scale',
  ], 3);

  // Object internal instance
  model.matrix = mat4.create();
  model.rotation = mat4.create();
  model.transform = null; // FIXME

  // Object methods
  vtkProp3D(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkProp3D');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
