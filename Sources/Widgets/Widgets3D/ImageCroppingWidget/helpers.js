import { quat, mat4, vec3 } from 'gl-matrix';

// Labels used to encode handle position in the handle state's name property
export const AXES = ['-', '=', '+'];

// ----------------------------------------------------------------------------

export function transformVec3(ain, transform) {
  const vout = new Float64Array(3);
  vec3.transformMat4(vout, ain, transform);
  return vout;
}

// ----------------------------------------------------------------------------

export function rotateVec3(vec, transform) {
  // transform is a mat4
  const out = vec3.create();
  const q = quat.create();
  mat4.getRotation(q, transform);
  vec3.transformQuat(out, vec, q);
  return out;
}

// ----------------------------------------------------------------------------

export function handleTypeFromName(name) {
  const [i, j, k] = name.split('').map((l) => AXES.indexOf(l) - 1);
  if (i * j * k !== 0) {
    return 'corners';
  }
  if (i * j !== 0 || j * k !== 0 || k * i !== 0) {
    return 'edges';
  }
  return 'faces';
}

export function calculateCropperCenter(planes, transform) {
  // get center of current crop box
  const center = [
    (planes[0] + planes[1]) / 2,
    (planes[2] + planes[3]) / 2,
    (planes[4] + planes[5]) / 2,
  ];
  return transformVec3(center, transform);
}

export function calculateDirection(v1, v2) {
  const direction = vec3.create();
  vec3.subtract(direction, v1, v2);
  vec3.normalize(direction, direction);
  return direction;
}
