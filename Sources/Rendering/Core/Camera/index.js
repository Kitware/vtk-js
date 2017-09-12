import { quat, vec3, vec4, mat3, mat4 } from 'gl-matrix';

import macro   from 'vtk.js/Sources/macro';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';

const { vtkDebugMacro } = macro;

/* eslint-disable new-cap */

/*
 * Convenience function to access elements of a gl-matrix.  If it turns
 * out I have rows and columns swapped everywhere, then I'll just change
 * the order of 'row' and 'col' parameters in this function
 */
// function getMatrixElement(matrix, row, col) {
//   const idx = (row * 4) + col;
//   return matrix[idx];
// }

// ----------------------------------------------------------------------------
// vtkCamera methods
// ----------------------------------------------------------------------------

function vtkCamera(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCamera');

  // Set up private variables and methods
  const viewMatrix = mat4.create();
  const projectionMatrix = mat4.create();

  publicAPI.orthogonalizeViewUp = () => {
    const vt = publicAPI.getViewTransformMatrix();
    model.viewUp[0] = vt[4];
    model.viewUp[1] = vt[5];
    model.viewUp[2] = vt[6];

    publicAPI.modified();
  };

  publicAPI.setPosition = (x, y, z) => {
    if (x === model.position[0] &&
        y === model.position[1] &&
        z === model.position[2]) {
      return;
    }

    model.position[0] = x;
    model.position[1] = y;
    model.position[2] = z;

    // recompute the focal distance
    publicAPI.computeDistance();
    // publicAPI.computeCameraLightTransform();

    publicAPI.modified();
  };

  publicAPI.setFocalPoint = (x, y, z) => {
    if (x === model.focalPoint[0] &&
        y === model.focalPoint[1] &&
        z === model.focalPoint[2]) {
      return;
    }

    model.focalPoint[0] = x;
    model.focalPoint[1] = y;
    model.focalPoint[2] = z;

    // recompute the focal distance
    publicAPI.computeDistance();
    // publicAPI.computeCameraLightTransform();

    publicAPI.modified();
  };

  publicAPI.setDistance = (d) => {
    if (model.distance === d) {
      return;
    }

    model.distance = d;

    if (model.distance < 1e-20) {
      model.distance = 1e-20;
      vtkDebugMacro('Distance is set to minimum.');
    }

    // we want to keep the camera pointing in the same direction
    const vec = model.directionOfProjection;

    // recalculate FocalPoint
    model.focalPoint[0] = model.position[0] + (vec[0] * model.distance);
    model.focalPoint[1] = model.position[1] + (vec[1] * model.distance);
    model.focalPoint[2] = model.position[2] + (vec[2] * model.distance);

    publicAPI.modified();
  };

  //----------------------------------------------------------------------------
  // This method must be called when the focal point or camera position changes
  publicAPI.computeDistance = () => {
    const dx = model.focalPoint[0] - model.position[0];
    const dy = model.focalPoint[1] - model.position[1];
    const dz = model.focalPoint[2] - model.position[2];

    model.distance = Math.sqrt((dx * dx) + (dy * dy) + (dz * dz));

    if (model.distance < 1e-20) {
      model.distance = 1e-20;
      vtkDebugMacro('Distance is set to minimum.');

      const vec = model.directionOfProjection;

      // recalculate FocalPoint
      model.focalPoint[0] = model.position[0] + (vec[0] * model.distance);
      model.focalPoint[1] = model.position[1] + (vec[1] * model.distance);
      model.focalPoint[2] = model.position[2] + (vec[2] * model.distance);
    }

    model.directionOfProjection[0] = dx / model.distance;
    model.directionOfProjection[1] = dy / model.distance;
    model.directionOfProjection[2] = dz / model.distance;

    publicAPI.computeViewPlaneNormal();
  };

//----------------------------------------------------------------------------
  publicAPI.computeViewPlaneNormal = () => {
    // VPN is -DOP
    model.viewPlaneNormal[0] = -model.directionOfProjection[0];
    model.viewPlaneNormal[1] = -model.directionOfProjection[1];
    model.viewPlaneNormal[2] = -model.directionOfProjection[2];
  };

  //----------------------------------------------------------------------------
  // Move the position of the camera along the view plane normal. Moving
  // towards the focal point (e.g., > 1) is a dolly-in, moving away
  // from the focal point (e.g., < 1) is a dolly-out.
  publicAPI.dolly = (amount) => {
    if (amount <= 0.0) {
      return;
    }

    // dolly moves the camera towards the focus
    const d = model.distance / amount;

    publicAPI.setPosition(
      model.focalPoint[0] - (d * model.directionOfProjection[0]),
      model.focalPoint[1] - (d * model.directionOfProjection[1]),
      model.focalPoint[2] - (d * model.directionOfProjection[2]));
  };

  publicAPI.setRoll = (roll) => {

  };

  publicAPI.getRoll = () => {

  };

  publicAPI.roll = (angle) => {
    const eye = model.position;
    const at = model.focalPoint;
    const up = model.viewUp;
    const viewUpVec4 = vec4.fromValues(up[0], up[1], up[2], 0.0);

    const rotateMatrix = mat4.create();   // FIXME: don't create a new one each time?
    const viewDir = vec3.fromValues((at[0] - eye[0]), (at[1] - eye[1]), (at[2] - eye[2]));
    mat4.rotate(rotateMatrix, rotateMatrix, vtkMath.radiansFromDegrees(angle), viewDir);
    vec4.transformMat4(viewUpVec4, viewUpVec4, rotateMatrix);

    model.viewUp[0] = viewUpVec4[0];
    model.viewUp[1] = viewUpVec4[1];
    model.viewUp[2] = viewUpVec4[2];

    publicAPI.modified();
  };

  publicAPI.azimuth = (angle) => {
    const newPosition = vec3.create();
    const fp = model.focalPoint;

    const trans = mat4.create();
    mat4.identity(trans);

    // translate the focal point to the origin,
    // rotate about view up,
    // translate back again
    mat4.translate(trans, trans, vec3.fromValues(fp[0], fp[1], fp[2]));
    mat4.rotate(trans, trans, vtkMath.radiansFromDegrees(angle), vec3.fromValues(model.viewUp[0], model.viewUp[1], model.viewUp[2]));
    mat4.translate(trans, trans, vec3.fromValues(-fp[0], -fp[1], -fp[2]));

    // apply the transform to the position
    vec3.transformMat4(newPosition, vec3.fromValues(model.position[0], model.position[1], model.position[2]), trans);
    publicAPI.setPosition(newPosition[0], newPosition[1], newPosition[2]);
  };

  publicAPI.yaw = (angle) => {
    const newFocalPoint = vec3.create();
    const position = model.position;

    const trans = mat4.create();
    mat4.identity(trans);

    // translate the camera to the origin,
    // rotate about axis,
    // translate back again
    mat4.translate(trans, trans, vec3.fromValues(position[0], position[1], position[2]));
    mat4.rotate(trans, trans, vtkMath.radiansFromDegrees(angle), vec3.fromValues(model.viewUp[0], model.viewUp[1], model.viewUp[2]));
    mat4.translate(trans, trans, vec3.fromValues(-position[0], -position[1], -position[2]));

    // apply the transform to the position
    vec3.transformMat4(newFocalPoint, vec3.fromValues(model.focalPoint[0], model.focalPoint[1], model.focalPoint[2]), trans);
    publicAPI.setFocalPoint(newFocalPoint[0], newFocalPoint[1], newFocalPoint[2]);
  };

  publicAPI.elevation = (angle) => {
    const newPosition = vec3.create();
    const fp = model.focalPoint;

    const vt = publicAPI.getViewTransformMatrix();
    const axis = [-vt[0], -vt[1], -vt[2]];

    const trans = mat4.create();
    mat4.identity(trans);

    // translate the focal point to the origin,
    // rotate about view up,
    // translate back again
    mat4.translate(trans, trans, vec3.fromValues(fp[0], fp[1], fp[2]));
    mat4.rotate(trans, trans, vtkMath.radiansFromDegrees(angle), vec3.fromValues(axis[0], axis[1], axis[2]));
    mat4.translate(trans, trans, vec3.fromValues(-fp[0], -fp[1], -fp[2]));

    // apply the transform to the position
    vec3.transformMat4(newPosition, vec3.fromValues(model.position[0], model.position[1], model.position[2]), trans);
    publicAPI.setPosition(newPosition[0], newPosition[1], newPosition[2]);
  };

  publicAPI.pitch = (angle) => {
    const newFocalPoint = vec3.create();
    const position = model.position;

    const vt = publicAPI.getViewTransformMatrix();
    const axis = [vt[0], vt[1], vt[2]];

    const trans = mat4.create();
    mat4.identity(trans);

    // translate the camera to the origin,
    // rotate about axis,
    // translate back again
    mat4.translate(trans, trans, vec3.fromValues(position[0], position[1], position[2]));
    mat4.rotate(trans, trans, vtkMath.radiansFromDegrees(angle), vec3.fromValues(axis[0], axis[1], axis[2]));
    mat4.translate(trans, trans, vec3.fromValues(-position[0], -position[1], -position[2]));

    // apply the transform to the position
    vec3.transformMat4(newFocalPoint, vec3.fromValues(model.focalPoint[0], model.focalPoint[1], model.focalPoint[2]), trans);
    publicAPI.setFocalPoint(newFocalPoint[0], newFocalPoint[1], newFocalPoint[2]);
  };

  publicAPI.zoom = (factor) => {
    if (factor <= 0) {
      return;
    }
    if (model.parallelProjection) {
      model.parallelScale /= factor;
    } else {
      model.viewAngle /= factor;
    }
    publicAPI.modified();
  };

  publicAPI.setThickness = (thickness) => {

  };

  publicAPI.setObliqueAngles = (alpha, beta) => {

  };

  publicAPI.getViewTransformMatrix = () => {
    const eye = model.position;
    const at = model.focalPoint;
    const up = model.viewUp;

    const result = mat4.create();
    mat4.lookAt(viewMatrix,
      vec3.fromValues(eye[0], eye[1], eye[2]),  // eye
      vec3.fromValues(at[0], at[1], at[2]),     // at
      vec3.fromValues(up[0], up[1], up[2]));    // up

    mat4.transpose(viewMatrix, viewMatrix);
    mat4.copy(result, viewMatrix);
    return result;
  };

  publicAPI.getProjectionTransformMatrix = (aspect, nearz, farz) => {
    mat4.identity(projectionMatrix);

    // FIXME: Not sure what to do about adjust z buffer here
    // adjust Z-buffer range
    // this->ProjectionTransform->AdjustZBuffer( -1, +1, nearz, farz );
    const cWidth = model.clippingRange[1] - model.clippingRange[0];
    const cRange = [
      model.clippingRange[0] + (((nearz + 1) * cWidth) / 2.0),
      model.clippingRange[0] + (((farz + 1) * cWidth) / 2.0)];

    if (model.parallelProjection) {
      // set up a rectangular parallelipiped
      const width = model.parallelScale * aspect;
      const height = model.parallelScale;

      const xmin = (model.windowCenter[0] - 1.0) * width;
      const xmax = (model.windowCenter[0] + 1.0) * width;
      const ymin = (model.windowCenter[1] - 1.0) * height;
      const ymax = (model.windowCenter[1] + 1.0) * height;

      // mat4.ortho(out, left, right, bottom, top, near, far)
      mat4.ortho(projectionMatrix, xmin, xmax, ymin, ymax, nearz, farz);
      mat4.transpose(projectionMatrix, projectionMatrix);
    } else if (model.useOffAxisProjection) {
      throw new Error('Off-Axis projection is not supported at this time');
    } else {
      const tmp = Math.tan(vtkMath.radiansFromDegrees(model.viewAngle) / 2.0);
      let width;
      let height;
      if (model.useHorizontalViewAngle === true) {
        width = model.clippingRange[0] * tmp;
        height = model.clippingRange[0] * tmp / aspect;
      } else {
        width = model.clippingRange[0] * tmp * aspect;
        height = model.clippingRange[0] * tmp;
      }

      const xmin = (model.windowCenter[0] - 1.0) * width;
      const xmax = (model.windowCenter[0] + 1.0) * width;
      const ymin = (model.windowCenter[1] - 1.0) * height;
      const ymax = (model.windowCenter[1] + 1.0) * height;
      const znear = cRange[0];
      const zfar = cRange[1];

      projectionMatrix[0] = 2.0 * znear / (xmax - xmin);
      projectionMatrix[5] = 2.0 * znear / (ymax - ymin);
      projectionMatrix[2] = (xmin + xmax) / (xmax - xmin);
      projectionMatrix[6] = (ymin + ymax) / (ymax - ymin);
      projectionMatrix[10] = -(znear + zfar) / (zfar - znear);
      projectionMatrix[14] = -1.0;
      projectionMatrix[11] = -2.0 * znear * zfar / (zfar - znear);
      projectionMatrix[15] = 0.0;
    }

    const result = mat4.create();
    mat4.copy(result, projectionMatrix);

    return result;
  };

  publicAPI.getCompositeProjectionTransformMatrix = (aspect, nearz, farz) => {
    const vMat = publicAPI.getViewTransformMatrix();
    const pMat = publicAPI.getProjectionTransformMatrix(aspect, nearz, farz);
    const result = mat4.create();
    mat4.multiply(result, vMat, pMat);
    return result;
  };

  // publicAPI.getProjectionTransformMatrix = renderer => {
  //   // return glmatrix object
  // };

  publicAPI.getFrustumPlanes = (aspect) => {
    // Return array of 24 params (4 params for each of 6 plane equations)
  };

  publicAPI.getOrientation = () => {

  };

  publicAPI.getOrientationWXYZ = () => {

  };

  publicAPI.setDirectionOfProjection = (x, y, z) => {
    if (model.directionOfProjection[0] === x &&
        model.directionOfProjection[1] === y &&
        model.directionOfProjection[2] === z) {
      return;
    }

    model.directionOfProjection[0] = x;
    model.directionOfProjection[1] = y;
    model.directionOfProjection[2] = z;

    const vec = model.directionOfProjection;

    // recalculate FocalPoint
    model.focalPoint[0] = model.position[0] + (vec[0] * model.distance);
    model.focalPoint[1] = model.position[1] + (vec[1] * model.distance);
    model.focalPoint[2] = model.position[2] + (vec[2] * model.distance);
    publicAPI.computeViewPlaneNormal();
  };

  // used to handle convert js device orientation angles
  // when you use this method the camera will adjust to the
  // device orientation such that the physicalViewUp you set
  // in world coordinates looks up, and the physicalViewNorth
  // you set in world coorindates will (maybe) point north
  publicAPI.setDeviceAngles = (alpha, beta, gamma, screen) => {
    const rotmat = mat4.create(); // phone to physical coordinates
    mat4.rotateZ(rotmat, rotmat, vtkMath.radiansFromDegrees(alpha));
    mat4.rotateX(rotmat, rotmat, vtkMath.radiansFromDegrees(beta));
    mat4.rotateY(rotmat, rotmat, vtkMath.radiansFromDegrees(gamma));
    mat4.rotateZ(rotmat, rotmat, vtkMath.radiansFromDegrees(-screen));

    const dop = vec3.fromValues(0.0, 0.0, -1.0);
    const vup = vec3.fromValues(0.0, 1.0, 0.0);
    const newdop = vec3.create();
    const newvup = vec3.create();
    vec3.transformMat4(newdop, dop, rotmat);
    vec3.transformMat4(newvup, vup, rotmat);

    // now the physical to vtk world tform
    const physVRight = [3];
    vtkMath.cross(model.physicalViewNorth, model.physicalViewUp, physVRight);
    const phystoworld = mat3.create();
    phystoworld[0] = physVRight[0];
    phystoworld[1] = physVRight[1];
    phystoworld[2] = physVRight[2];
    phystoworld[3] = model.physicalViewNorth[0];
    phystoworld[4] = model.physicalViewNorth[1];
    phystoworld[5] = model.physicalViewNorth[2];
    phystoworld[6] = model.physicalViewUp[0];
    phystoworld[7] = model.physicalViewUp[1];
    phystoworld[8] = model.physicalViewUp[2];
    mat3.transpose(phystoworld, phystoworld);
    vec3.transformMat3(newdop, newdop, phystoworld);
    vec3.transformMat3(newvup, newvup, phystoworld);

    publicAPI.setDirectionOfProjection(newdop[0], newdop[1], newdop[2]);
    publicAPI.setViewUp(newvup[0], newvup[1], newvup[2]);
    publicAPI.modified();
  };

  publicAPI.setOrientationWXYZ = (degrees, x, y, z) => {
    const quatMat = mat4.create();

    if (degrees !== 0.0 && (x !== 0.0 || y !== 0.0 || z !== 0.0)) {
      // convert to radians
      const angle = vtkMath.radiansFromDegrees(degrees);
      const q = quat.create();
      quat.setAxisAngle(q, [x, y, z], angle);
      quat.toMat4(q, quatMat);
    }

    const dop = vec3.fromValues(0.0, 0.0, -1.0);
    const newdop = vec3.create();
    vec3.transformMat4(newdop, dop, quatMat);

    const vup = vec3.fromValues(0.0, 1.0, 0.0);
    const newvup = vec3.create();
    vec3.transformMat4(newvup, vup, quatMat);

    publicAPI.setDirectionOfProjection(newdop[0], newdop[1], newdop[2]);
    publicAPI.setViewUp(newvup[0], newvup[1], newvup[2]);
    publicAPI.modified();
  };

  publicAPI.getCameraLightTransformMatrix = () => {

  };

  publicAPI.updateViewport = () => {

  };

  publicAPI.shallowCopy = (sourceCamera) => {

  };

  publicAPI.setScissorRect = (rect) => {
    // rect is a vtkRect
  };

  publicAPI.getScissorRect = () => {

  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

export const DEFAULT_VALUES = {
  position: [0, 0, 1],
  focalPoint: [0, 0, 0],
  viewUp: [0, 1, 0],
  directionOfProjection: [0, 0, -1],
  parallelProjection: false,
  useHorizontalViewAngle: false,
  viewAngle: 30,
  parallelScale: 1,
  clippingRange: [0.01, 1000.01],
  thickness: 1000,
  windowCenter: [0, 0],
  viewPlaneNormal: [0, 0, 1],
  focalDisk: 1,
  useOffAxisProjection: false,
  screenBottomLeft: [-0.5, -0.5, -0.5],
  screenBottomRight: [0.5, -0.5, -0.5],
  screenTopRight: [0.5, 0.5, -0.5],
  userViewTransform: null,
  userTransform: null,
  freezeFocalPoint: false,
  useScissor: false,
  physicalViewUp: [0.0, 1.0, 0.0],
  physicalViewNorth: [0.0, 0.0, -1.0],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  macro.get(publicAPI, model, [
    'distance',
    'thickness',
    'userViewTransform',
    'userTransform',
  ]);

  macro.setGet(publicAPI, model, [
    'parallelProjection',
    'useHorizontalViewAngle',
    'viewAngle',
    'parallelScale',
    'focalDisk',
    'useOffAxisProjection',
    'freezeFocalPoint',
    'useScissor',
  ]);

  macro.getArray(publicAPI, model, [
    'directionOfProjection',
    'viewPlaneNormal',
    'position',
    'focalPoint',
  ]);

  macro.setGetArray(publicAPI, model, [
    'clippingRange',
    'windowCenter',
  ], 2);

  macro.setGetArray(publicAPI, model, [
    'viewUp',
    'screenBottomLeft',
    'screenBottomRight',
    'screenTopRight',
    'physicalViewUp',
    'physicalViewNorth',
  ], 3);

  // Object methods
  vtkCamera(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkCamera');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
