import { quat, vec3, vec4, mat4 } from 'gl-matrix';

import macro from 'vtk.js/Sources/macros';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

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
  const origin = new Float64Array(3);
  const dopbasis = new Float64Array([0.0, 0.0, -1.0]);
  const upbasis = new Float64Array([0.0, 1.0, 0.0]);
  const tmpMatrix = mat4.identity(new Float64Array(16));
  const tmpMatrix2 = mat4.identity(new Float64Array(16));
  const tmpvec1 = new Float64Array(3);
  const tmpvec2 = new Float64Array(3);
  const tmpvec3 = new Float64Array(3);

  const rotateMatrix = mat4.identity(new Float64Array(16));
  const trans = mat4.identity(new Float64Array(16));
  const newPosition = new Float64Array(3);
  const newFocalPoint = new Float64Array(3);

  // Internal Functions that don't need to be public
  function computeViewPlaneNormal() {
    // VPN is -DOP
    model.viewPlaneNormal[0] = -model.directionOfProjection[0];
    model.viewPlaneNormal[1] = -model.directionOfProjection[1];
    model.viewPlaneNormal[2] = -model.directionOfProjection[2];
  }

  publicAPI.orthogonalizeViewUp = () => {
    const vt = publicAPI.getViewMatrix();
    model.viewUp[0] = vt[4];
    model.viewUp[1] = vt[5];
    model.viewUp[2] = vt[6];

    publicAPI.modified();
  };

  publicAPI.setPosition = (x, y, z) => {
    if (
      x === model.position[0] &&
      y === model.position[1] &&
      z === model.position[2]
    ) {
      return;
    }

    model.position[0] = x;
    model.position[1] = y;
    model.position[2] = z;

    // recompute the focal distance
    publicAPI.computeDistance();
    publicAPI.modified();
  };

  publicAPI.setFocalPoint = (x, y, z) => {
    if (
      x === model.focalPoint[0] &&
      y === model.focalPoint[1] &&
      z === model.focalPoint[2]
    ) {
      return;
    }

    model.focalPoint[0] = x;
    model.focalPoint[1] = y;
    model.focalPoint[2] = z;

    // recompute the focal distance
    publicAPI.computeDistance();
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
    model.focalPoint[0] = model.position[0] + vec[0] * model.distance;
    model.focalPoint[1] = model.position[1] + vec[1] * model.distance;
    model.focalPoint[2] = model.position[2] + vec[2] * model.distance;
    publicAPI.modified();
  };

  //----------------------------------------------------------------------------
  // This method must be called when the focal point or camera position changes
  publicAPI.computeDistance = () => {
    const dx = model.focalPoint[0] - model.position[0];
    const dy = model.focalPoint[1] - model.position[1];
    const dz = model.focalPoint[2] - model.position[2];

    model.distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (model.distance < 1e-20) {
      model.distance = 1e-20;
      vtkDebugMacro('Distance is set to minimum.');

      const vec = model.directionOfProjection;

      // recalculate FocalPoint
      model.focalPoint[0] = model.position[0] + vec[0] * model.distance;
      model.focalPoint[1] = model.position[1] + vec[1] * model.distance;
      model.focalPoint[2] = model.position[2] + vec[2] * model.distance;
    }

    model.directionOfProjection[0] = dx / model.distance;
    model.directionOfProjection[1] = dy / model.distance;
    model.directionOfProjection[2] = dz / model.distance;

    computeViewPlaneNormal();
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
      model.focalPoint[0] - d * model.directionOfProjection[0],
      model.focalPoint[1] - d * model.directionOfProjection[1],
      model.focalPoint[2] - d * model.directionOfProjection[2]
    );
  };

  publicAPI.roll = (angle) => {
    const eye = model.position;
    const at = model.focalPoint;
    const up = model.viewUp;
    const viewUpVec4 = new Float64Array([up[0], up[1], up[2], 0.0]);

    mat4.identity(rotateMatrix);
    const viewDir = new Float64Array([
      at[0] - eye[0],
      at[1] - eye[1],
      at[2] - eye[2],
    ]);
    mat4.rotate(
      rotateMatrix,
      rotateMatrix,
      vtkMath.radiansFromDegrees(angle),
      viewDir
    );
    vec4.transformMat4(viewUpVec4, viewUpVec4, rotateMatrix);

    model.viewUp[0] = viewUpVec4[0];
    model.viewUp[1] = viewUpVec4[1];
    model.viewUp[2] = viewUpVec4[2];

    publicAPI.modified();
  };

  publicAPI.azimuth = (angle) => {
    const fp = model.focalPoint;

    mat4.identity(trans);

    // translate the focal point to the origin,
    // rotate about view up,
    // translate back again
    mat4.translate(trans, trans, fp);
    mat4.rotate(trans, trans, vtkMath.radiansFromDegrees(angle), model.viewUp);
    mat4.translate(trans, trans, [-fp[0], -fp[1], -fp[2]]);

    // apply the transform to the position
    vec3.transformMat4(newPosition, model.position, trans);
    publicAPI.setPosition(newPosition[0], newPosition[1], newPosition[2]);
  };

  publicAPI.yaw = (angle) => {
    const position = model.position;

    mat4.identity(trans);

    // translate the camera to the origin,
    // rotate about axis,
    // translate back again
    mat4.translate(trans, trans, position);
    mat4.rotate(trans, trans, vtkMath.radiansFromDegrees(angle), model.viewUp);
    mat4.translate(trans, trans, [-position[0], -position[1], -position[2]]);

    // apply the transform to the position
    vec3.transformMat4(newFocalPoint, model.focalPoint, trans);
    publicAPI.setFocalPoint(
      newFocalPoint[0],
      newFocalPoint[1],
      newFocalPoint[2]
    );
  };

  publicAPI.elevation = (angle) => {
    const fp = model.focalPoint;

    // get the eye / camera position from the viewMatrix
    const vt = publicAPI.getViewMatrix();
    const axis = [-vt[0], -vt[1], -vt[2]];

    mat4.identity(trans);

    // translate the focal point to the origin,
    // rotate about view up,
    // translate back again
    mat4.translate(trans, trans, fp);
    mat4.rotate(trans, trans, vtkMath.radiansFromDegrees(angle), axis);
    mat4.translate(trans, trans, [-fp[0], -fp[1], -fp[2]]);

    // apply the transform to the position
    vec3.transformMat4(newPosition, model.position, trans);
    publicAPI.setPosition(newPosition[0], newPosition[1], newPosition[2]);
  };

  publicAPI.pitch = (angle) => {
    const position = model.position;

    const vt = publicAPI.getViewMatrix();
    const axis = [vt[0], vt[1], vt[2]];

    mat4.identity(trans);

    // translate the camera to the origin,
    // rotate about axis,
    // translate back again
    mat4.translate(trans, trans, position);
    mat4.rotate(trans, trans, vtkMath.radiansFromDegrees(angle), axis);
    mat4.translate(trans, trans, [-position[0], -position[1], -position[2]]);

    // apply the transform to the focal point
    vec3.transformMat4(newFocalPoint, model.focalPoint, trans);
    publicAPI.setFocalPoint(...newFocalPoint);
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

  publicAPI.translate = (x, y, z) => {
    const offset = [x, y, z];

    vtkMath.add(model.position, offset, model.position);
    vtkMath.add(model.focalPoint, offset, model.focalPoint);

    publicAPI.computeDistance();
    publicAPI.modified();
  };

  publicAPI.applyTransform = (transformMat4) => {
    const vuOld = [...model.viewUp, 1.0];
    const posNew = [];
    const fpNew = [];
    const vuNew = [];

    vuOld[0] += model.position[0];
    vuOld[1] += model.position[1];
    vuOld[2] += model.position[2];

    vec4.transformMat4(posNew, [...model.position, 1.0], transformMat4);
    vec4.transformMat4(fpNew, [...model.focalPoint, 1.0], transformMat4);
    vec4.transformMat4(vuNew, vuOld, transformMat4);

    vuNew[0] -= posNew[0];
    vuNew[1] -= posNew[1];
    vuNew[2] -= posNew[2];

    publicAPI.setPosition(...posNew.slice(0, 3));
    publicAPI.setFocalPoint(...fpNew.slice(0, 3));
    publicAPI.setViewUp(...vuNew.slice(0, 3));
  };

  publicAPI.getThickness = () =>
    model.clippingRange[1] - model.clippingRange[0];

  publicAPI.setThickness = (thickness) => {
    let t = thickness;
    if (t < 1e-20) {
      t = 1e-20;
      vtkDebugMacro('Thickness is set to minimum.');
    }
    publicAPI.setClippingRange(
      model.clippingRange[0],
      model.clippingRange[0] + t
    );
  };

  publicAPI.setThicknessFromFocalPoint = (thickness) => {
    let t = thickness;
    if (t < 1e-20) {
      t = 1e-20;
      vtkDebugMacro('Thickness is set to minimum.');
    }
    publicAPI.setClippingRange(model.distance - t / 2, model.distance + t / 2);
  };

  // Unimplemented functions
  publicAPI.setRoll = (angle) => {}; // dependency on GetOrientation() and a model.ViewTransform object, see https://github.com/Kitware/VTK/blob/master/Common/Transforms/vtkTransform.cxx and https://vtk.org/doc/nightly/html/classvtkTransform.html
  publicAPI.getRoll = () => {};
  publicAPI.setObliqueAngles = (alpha, beta) => {};
  publicAPI.getOrientation = () => {};
  publicAPI.getOrientationWXYZ = () => {};
  publicAPI.getFrustumPlanes = (aspect) => {
    // Return array of 24 params (4 params for each of 6 plane equations)
  };
  publicAPI.getCameraLightTransformMatrix = (matrix) => {
    mat4.copy(matrix, model.cameraLightTransform);
    return matrix;
  };

  publicAPI.computeCameraLightTransform = () => {
    // not sure if this is the correct transformation, based on the same funciton in VTK
    mat4.copy(tmpMatrix, publicAPI.getViewMatrix());
    mat4.invert(tmpMatrix, tmpMatrix);

    mat4.fromScaling(tmpMatrix2, [
      model.distance,
      model.distance,
      model.distance,
    ]);
    mat4.multiply(tmpMatrix, tmpMatrix, tmpMatrix2);
    mat4.identity(model.cameraLightTransform);
    mat4.translate(model.cameraLightTransform, tmpMatrix, [0.0, 0.0, -1.0]);
  };

  publicAPI.deepCopy = (sourceCamera) => {};

  publicAPI.physicalOrientationToWorldDirection = (ori) => {
    // push the x axis through the orientation quat
    const oriq = quat.fromValues(ori[0], ori[1], ori[2], ori[3]);
    const coriq = quat.create();
    const qdir = quat.fromValues(0.0, 0.0, 1.0, 0.0);
    quat.conjugate(coriq, oriq);

    // rotate the z axis by the quat
    quat.multiply(qdir, oriq, qdir);
    quat.multiply(qdir, qdir, coriq);

    // return the z axis in world coords
    return [qdir[0], qdir[1], qdir[2]];
  };

  publicAPI.getPhysicalToWorldMatrix = (result) => {
    publicAPI.getWorldToPhysicalMatrix(result);
    mat4.invert(result, result);
  };

  publicAPI.getWorldToPhysicalMatrix = (result) => {
    mat4.identity(result);

    // now the physical to vtk world rotation tform
    const physVRight = [3];
    vtkMath.cross(model.physicalViewNorth, model.physicalViewUp, physVRight);
    result[0] = physVRight[0];
    result[1] = physVRight[1];
    result[2] = physVRight[2];
    result[4] = model.physicalViewUp[0];
    result[5] = model.physicalViewUp[1];
    result[6] = model.physicalViewUp[2];
    result[8] = -model.physicalViewNorth[0];
    result[9] = -model.physicalViewNorth[1];
    result[10] = -model.physicalViewNorth[2];
    mat4.transpose(result, result);

    vec3.set(
      tmpvec1,
      1 / model.physicalScale,
      1 / model.physicalScale,
      1 / model.physicalScale
    );

    mat4.scale(result, result, tmpvec1);
    mat4.translate(result, result, model.physicalTranslation);
  };

  publicAPI.computeViewParametersFromViewMatrix = (vmat) => {
    // invert to get view to world
    mat4.invert(tmpMatrix, vmat);

    // note with glmatrix operations happen in
    // the reverse order
    // mat.scale
    // mat.translate
    // will result in the translation then the scale
    // mat.mult(a,b)
    // results in perform the B transformation then A

    // then extract the params position, orientation
    // push 0,0,0 through to get a translation
    vec3.transformMat4(tmpvec1, origin, tmpMatrix);
    publicAPI.computeDistance();
    const oldDist = model.distance;
    publicAPI.setPosition(tmpvec1[0], tmpvec1[1], tmpvec1[2]);

    // push basis vectors to get orientation
    vec3.transformMat4(tmpvec2, dopbasis, tmpMatrix);
    vec3.subtract(tmpvec2, tmpvec2, tmpvec1);
    vec3.normalize(tmpvec2, tmpvec2);
    publicAPI.setDirectionOfProjection(tmpvec2[0], tmpvec2[1], tmpvec2[2]);

    vec3.transformMat4(tmpvec3, upbasis, tmpMatrix);
    vec3.subtract(tmpvec3, tmpvec3, tmpvec1);
    vec3.normalize(tmpvec3, tmpvec3);
    publicAPI.setViewUp(tmpvec3[0], tmpvec3[1], tmpvec3[2]);

    publicAPI.setDistance(oldDist);
  };

  // the provided matrix should include
  // translation and orientation only
  // mat is physical to view
  publicAPI.computeViewParametersFromPhysicalMatrix = (mat) => {
    // get the WorldToPhysicalMatrix
    publicAPI.getWorldToPhysicalMatrix(tmpMatrix);

    // first convert the physical -> view matrix to be
    // world -> view
    mat4.multiply(tmpMatrix, mat, tmpMatrix);

    publicAPI.computeViewParametersFromViewMatrix(tmpMatrix);
  };

  publicAPI.setViewMatrix = (mat) => {
    model.viewMatrix = mat;
    if (model.viewMatrix) {
      mat4.copy(tmpMatrix, model.viewMatrix);
      publicAPI.computeViewParametersFromViewMatrix(tmpMatrix);
      mat4.transpose(model.viewMatrix, model.viewMatrix);
    }
  };

  publicAPI.getViewMatrix = () => {
    if (model.viewMatrix) {
      return model.viewMatrix;
    }

    mat4.lookAt(
      tmpMatrix,
      model.position, // eye
      model.focalPoint, // at
      model.viewUp // up
    );

    mat4.transpose(tmpMatrix, tmpMatrix);

    const result = new Float64Array(16);
    mat4.copy(result, tmpMatrix);
    return result;
  };

  publicAPI.setProjectionMatrix = (mat) => {
    model.projectionMatrix = mat;
  };

  publicAPI.getProjectionMatrix = (aspect, nearz, farz) => {
    const result = new Float64Array(16);
    mat4.identity(result);

    if (model.projectionMatrix) {
      const scale = 1 / model.physicalScale;
      vec3.set(tmpvec1, scale, scale, scale);

      mat4.copy(result, model.projectionMatrix);
      mat4.scale(result, result, tmpvec1);
      mat4.transpose(result, result);
      return result;
    }

    mat4.identity(tmpMatrix);

    // FIXME: Not sure what to do about adjust z buffer here
    // adjust Z-buffer range
    // this->ProjectionTransform->AdjustZBuffer( -1, +1, nearz, farz );
    const cWidth = model.clippingRange[1] - model.clippingRange[0];
    const cRange = [
      model.clippingRange[0] + ((nearz + 1) * cWidth) / 2.0,
      model.clippingRange[0] + ((farz + 1) * cWidth) / 2.0,
    ];

    if (model.parallelProjection) {
      // set up a rectangular parallelipiped
      const width = model.parallelScale * aspect;
      const height = model.parallelScale;

      const xmin = (model.windowCenter[0] - 1.0) * width;
      const xmax = (model.windowCenter[0] + 1.0) * width;
      const ymin = (model.windowCenter[1] - 1.0) * height;
      const ymax = (model.windowCenter[1] + 1.0) * height;

      mat4.ortho(tmpMatrix, xmin, xmax, ymin, ymax, cRange[0], cRange[1]);
      mat4.transpose(tmpMatrix, tmpMatrix);
    } else if (model.useOffAxisProjection) {
      throw new Error('Off-Axis projection is not supported at this time');
    } else {
      const tmp = Math.tan(vtkMath.radiansFromDegrees(model.viewAngle) / 2.0);
      let width;
      let height;
      if (model.useHorizontalViewAngle === true) {
        width = model.clippingRange[0] * tmp;
        height = (model.clippingRange[0] * tmp) / aspect;
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

      tmpMatrix[0] = (2.0 * znear) / (xmax - xmin);
      tmpMatrix[5] = (2.0 * znear) / (ymax - ymin);
      tmpMatrix[2] = (xmin + xmax) / (xmax - xmin);
      tmpMatrix[6] = (ymin + ymax) / (ymax - ymin);
      tmpMatrix[10] = -(znear + zfar) / (zfar - znear);
      tmpMatrix[14] = -1.0;
      tmpMatrix[11] = (-2.0 * znear * zfar) / (zfar - znear);
      tmpMatrix[15] = 0.0;
    }

    mat4.copy(result, tmpMatrix);

    return result;
  };

  publicAPI.getCompositeProjectionMatrix = (aspect, nearz, farz) => {
    const vMat = publicAPI.getViewMatrix();
    const pMat = publicAPI.getProjectionMatrix(aspect, nearz, farz);
    // mats are transposed so the order is A then B
    // we reuse pMat as it is a copy so we can do what we want with it
    mat4.multiply(pMat, vMat, pMat);
    return pMat;
  };

  publicAPI.setDirectionOfProjection = (x, y, z) => {
    if (
      model.directionOfProjection[0] === x &&
      model.directionOfProjection[1] === y &&
      model.directionOfProjection[2] === z
    ) {
      return;
    }

    model.directionOfProjection[0] = x;
    model.directionOfProjection[1] = y;
    model.directionOfProjection[2] = z;

    const vec = model.directionOfProjection;

    // recalculate FocalPoint
    model.focalPoint[0] = model.position[0] + vec[0] * model.distance;
    model.focalPoint[1] = model.position[1] + vec[1] * model.distance;
    model.focalPoint[2] = model.position[2] + vec[2] * model.distance;
    computeViewPlaneNormal();
  };

  // used to handle convert js device orientation angles
  // when you use this method the camera will adjust to the
  // device orientation such that the physicalViewUp you set
  // in world coordinates looks up, and the physicalViewNorth
  // you set in world coorindates will (maybe) point north
  //
  // NOTE WARNING - much of the documentation out there on how
  // orientation works is seriously wrong. Even worse the Chrome
  // device orientation simulator is completely wrong and should
  // never be used. OMG it is so messed up.
  //
  // how it seems to work on iOS is that the device orientation
  // is specified in extrinsic angles with a alpha, beta, gamma
  // convention with axes of Z, X, Y (the code below substitutes
  // the physical coordinate system for these axes to get the right
  // modified coordinate system.
  publicAPI.setDeviceAngles = (alpha, beta, gamma, screen) => {
    const physVRight = [3];
    vtkMath.cross(model.physicalViewNorth, model.physicalViewUp, physVRight);

    // phone to physical coordinates
    const rotmat = mat4.identity(new Float64Array(16));
    mat4.rotate(
      rotmat,
      rotmat,
      vtkMath.radiansFromDegrees(alpha),
      model.physicalViewUp
    );
    mat4.rotate(rotmat, rotmat, vtkMath.radiansFromDegrees(beta), physVRight);
    mat4.rotate(
      rotmat,
      rotmat,
      vtkMath.radiansFromDegrees(gamma),
      model.physicalViewNorth
    );

    mat4.rotate(
      rotmat,
      rotmat,
      vtkMath.radiansFromDegrees(-screen),
      model.physicalViewUp
    );

    const dop = new Float64Array([
      -model.physicalViewUp[0],
      -model.physicalViewUp[1],
      -model.physicalViewUp[2],
    ]);
    const vup = new Float64Array(model.physicalViewNorth);
    vec3.transformMat4(dop, dop, rotmat);
    vec3.transformMat4(vup, vup, rotmat);

    publicAPI.setDirectionOfProjection(dop[0], dop[1], dop[2]);
    publicAPI.setViewUp(vup[0], vup[1], vup[2]);
    publicAPI.modified();
  };

  publicAPI.setOrientationWXYZ = (degrees, x, y, z) => {
    const quatMat = mat4.identity(new Float64Array(16));

    if (degrees !== 0.0 && (x !== 0.0 || y !== 0.0 || z !== 0.0)) {
      // convert to radians
      const angle = vtkMath.radiansFromDegrees(degrees);
      const q = quat.create();
      quat.setAxisAngle(q, [x, y, z], angle);
      mat4.fromQuat(quatMat, q);
    }

    const newdop = new Float64Array(3);
    vec3.transformMat4(newdop, [0.0, 0.0, -1.0], quatMat);

    const newvup = new Float64Array(3);
    vec3.transformMat4(newvup, [0.0, 1.0, 0.0], quatMat);

    publicAPI.setDirectionOfProjection(...newdop);
    publicAPI.setViewUp(...newvup);
    publicAPI.modified();
  };

  publicAPI.computeClippingRange = (bounds) => {
    let vn = null;
    let position = null;

    vn = model.viewPlaneNormal;
    position = model.position;

    const a = -vn[0];
    const b = -vn[1];
    const c = -vn[2];
    const d = -(a * position[0] + b * position[1] + c * position[2]);

    // Set the max near clipping plane and the min far clipping plane
    const range = [a * bounds[0] + b * bounds[2] + c * bounds[4] + d, 1e-18];

    // Find the closest / farthest bounding box vertex
    for (let k = 0; k < 2; k++) {
      for (let j = 0; j < 2; j++) {
        for (let i = 0; i < 2; i++) {
          const dist =
            a * bounds[i] + b * bounds[2 + j] + c * bounds[4 + k] + d;
          range[0] = dist < range[0] ? dist : range[0];
          range[1] = dist > range[1] ? dist : range[1];
        }
      }
    }

    return range;
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
  windowCenter: [0, 0],
  viewPlaneNormal: [0, 0, 1],
  useOffAxisProjection: false,
  screenBottomLeft: [-0.5, -0.5, -0.5],
  screenBottomRight: [0.5, -0.5, -0.5],
  screenTopRight: [0.5, 0.5, -0.5],
  freezeFocalPoint: false,
  projectionMatrix: null,
  viewMatrix: null,
  cameraLightTransform: mat4.create(),

  // used for world to physical transformations
  physicalTranslation: [0, 0, 0],
  physicalScale: 1.0,
  physicalViewUp: [0, 1, 0],
  physicalViewNorth: [0, 0, -1],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  macro.get(publicAPI, model, ['distance']);

  macro.setGet(publicAPI, model, [
    'parallelProjection',
    'useHorizontalViewAngle',
    'viewAngle',
    'parallelScale',
    'useOffAxisProjection',
    'freezeFocalPoint',
    'physicalScale',
  ]);

  macro.getArray(publicAPI, model, [
    'directionOfProjection',
    'viewPlaneNormal',
    'position',
    'focalPoint',
  ]);

  macro.setGetArray(publicAPI, model, ['clippingRange', 'windowCenter'], 2);

  macro.setGetArray(
    publicAPI,
    model,
    [
      'viewUp',
      'screenBottomLeft',
      'screenBottomRight',
      'screenTopRight',
      'physicalTranslation',
      'physicalViewUp',
      'physicalViewNorth',
    ],
    3
  );

  // Object methods
  vtkCamera(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkCamera');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
