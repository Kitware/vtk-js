import { vec3 } from 'gl-matrix';

// Labels used to encode handle position in the handle state's name property
export const AXES = ['-', '=', '+'];

// ----------------------------------------------------------------------------

export function transformVec3(ain, transform) {
  const vin = vec3.fromValues(ain[0], ain[1], ain[2]);
  const vout = vec3.create();
  vec3.transformMat4(vout, vin, transform);
  return [vout[0], vout[1], vout[2]];
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
