export function radiansFromDegrees(deg) {
  return deg / 180 * Math.PI;
}

export function areBoundsInitialized(bounds) {
  return !(bounds[1] - bounds[0] < 0.0);
}

export function uninitializeBounds(bounds) {
  bounds[0] = 1.0;
  bounds[1] = -1.0;
  bounds[2] = 1.0;
  bounds[3] = -1.0;
  bounds[4] = 1.0;
  bounds[5] = -1.0;
}

export default { uninitializeBounds, radiansFromDegrees, areBoundsInitialized };
