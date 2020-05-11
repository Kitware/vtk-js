import { ImageBorderMode, InterpolationMode } from './Constants';

export const vtkInterpolationInfo = {
  pointer: null,
  extent: [0, -1, 0, -1, 0, -1],
  increments: [0, 0, 0],
  scalarType: null, // dataType
  dataTypeSize: 1, // BYTES_PER_ELEMENT
  numberOfComponents: 1,
  borderMode: ImageBorderMode.CLAMP,
  interpolationMode: InterpolationMode.LINEAR,
  extraInfo: null,
};

export const vtkInterpolationWeights = {
  ...vtkInterpolationInfo,
  positions: [0, 0, 0],
  weights: null,
  weightExtent: [0, -1, 0, -1, 0, -1],
  kernelSize: [1, 1, 1],
  workspace: null,
  lastY: null,
  lastZ: null,
};

export function vtkInterpolationMathFloor(x) {
  const integer = Math.floor(x);
  return {
    floored: integer,
    error: x - integer,
  };
}

export function vtkInterpolationMathRound(x) {
  return Math.round(x);
}

//----------------------------------------------------------------------------
// Perform a clamp to limit an index to [b, c] and subtract b.

export function vtkInterpolationMathClamp(a, b, c) {
  let clamp = a <= c ? a : c;
  clamp -= b;
  clamp = clamp >= 0 ? clamp : 0;
  return clamp;
}

//----------------------------------------------------------------------------
// Perform a wrap to limit an index to [b, c] and subtract b.

export function vtkInterpolationMathWrap(a, b, c) {
  const range = c - b + 1;
  let wrap = a - b;
  wrap %= range;
  // required for some % implementations
  wrap = wrap >= 0 ? wrap : wrap + range;
  return wrap;
}

//----------------------------------------------------------------------------
// Perform a mirror to limit an index to [b, c] and subtract b.

export function vtkInterpolationMathMirror(a, b, c) {
  const range = c - b;
  const ifzero = range === 0 ? 1 : 0;
  const range2 = 2 * range + ifzero;
  let mirror = a - b;
  mirror = mirror >= 0 ? mirror : -mirror;
  mirror %= range2;
  mirror = mirror <= range ? mirror : range2 - mirror;
  return mirror;
}

export default {
  vtkInterpolationInfo,
  vtkInterpolationWeights,
  vtkInterpolationMathFloor,
  vtkInterpolationMathRound,
  vtkInterpolationMathClamp,
  vtkInterpolationMathWrap,
  vtkInterpolationMathMirror,
};
