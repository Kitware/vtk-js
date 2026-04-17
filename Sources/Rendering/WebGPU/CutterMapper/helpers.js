export function vec3ToVec4(out, x, y = 0.0) {
  out[0] = x[0];
  out[1] = x[1];
  out[2] = x[2];
  out[3] = y;
  return out;
}

export function shiftVec3ToVec4(out, x, shift) {
  out[0] = x[0] + shift[0];
  out[1] = x[1] + shift[1];
  out[2] = x[2] + shift[2];
  out[3] = 0.0;
  return out;
}

export function boundsToMinPoint(out, bounds, shift) {
  out[0] = bounds[0] + shift[0];
  out[1] = bounds[2] + shift[1];
  out[2] = bounds[4] + shift[2];
  out[3] = 0.0;
  return out;
}

export function boundsToMaxPoint(out, bounds, shift) {
  out[0] = bounds[1] + shift[0];
  out[1] = bounds[3] + shift[1];
  out[2] = bounds[5] + shift[2];
  out[3] = 0.0;
  return out;
}
