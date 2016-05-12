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

export function createUninitializedBouds() {
  return [].concat([
    Number.MAX_VALUE, Number.MIN_VALUE, // X
    Number.MAX_VALUE, Number.MIN_VALUE, // Y
    Number.MAX_VALUE, Number.MIN_VALUE, // Z
  ]);
}

export function dot(x, y) {
  return x[0] * y[0] + x[1] * y[1] + x[2] * y[2];
}

export default {
  uninitializeBounds,
  radiansFromDegrees,
  areBoundsInitialized,
  dot,
  createUninitializedBouds,
};
