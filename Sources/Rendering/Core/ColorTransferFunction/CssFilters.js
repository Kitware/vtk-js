/**
 * A helper file to transform RGBA points using CSS filters equivalent
 * The equivalents of CSS filters using SVG filters can be found here:
 * https://www.w3.org/TR/filter-effects-1/#ShorthandEquivalents
 * For each SVG filter, you can look for the maths behind it on the same page:
 * https://www.w3.org/TR/filter-effects-1/#FilterPrimitivesOverview
 *
 * For example, the saturate filter equivalent is here:
 * https://www.w3.org/TR/filter-effects-1/#saturateEquivalent
 * And the maths behind the feColorMatrix of type saturate is here:
 * https://www.w3.org/TR/filter-effects-1/#ref-for-attr-valuedef-type-saturate
 *
 * The transforms are done using matrices of size 5 by 5. They are row major
 * as in vtkMath. The vectors representing the RGBA points uses
 * [R, G, B, A, 1] vectors, with each channel between 0 and 1.
 */

import { identity, multiplyMatrix } from 'vtk.js/Sources/Common/Core/Math';

export const luminanceWeights = [0.213, 0.715, 0.072];

export function getNewFilter() {
  return new Array(25);
}

export function getIdentityFilter(outFilter = getNewFilter()) {
  return identity(5, outFilter);
}

export function combineFilters(
  baseFilter,
  newFilter,
  outFilter = getNewFilter()
) {
  multiplyMatrix(newFilter, baseFilter, 5, 5, 5, 5, outFilter);
  return outFilter;
}

export function applyFilter(filter, r, g, b, a = 1) {
  const vec = [r, g, b, a, 1];
  multiplyMatrix(filter, vec, 5, 5, 5, 1, vec);
  return vec.slice(0, 4);
}

export function getLinearFilter(slope, intercept, outFilter = getNewFilter()) {
  getIdentityFilter(outFilter);
  for (let row = 0; row < 3; ++row) {
    outFilter[row * 5 + row] = slope;
    outFilter[row * 5 + 4] = intercept;
  }
  return outFilter;
}

// https://www.w3.org/TR/filter-effects-1/#contrastEquivalent
// https://www.w3.org/TR/filter-effects-1/#attr-valuedef-type-linear
export function getContrastFilter(contrast, outFilter = getNewFilter()) {
  const slope = contrast;
  const intercept = -(0.5 * contrast) + 0.5;
  return getLinearFilter(slope, intercept, outFilter);
}

// https://www.w3.org/TR/filter-effects-1/#saturateEquivalent
// https://www.w3.org/TR/filter-effects-1/#ref-for-attr-valuedef-type-saturate
export function getSaturateFilter(saturate, outFilter = getNewFilter()) {
  getIdentityFilter(outFilter);
  for (let col = 0; col < 3; ++col) {
    const columnLuminance = luminanceWeights[col];
    const diagonalValue = columnLuminance + (1 - columnLuminance) * saturate;
    const nonDiagonalValue = columnLuminance - columnLuminance * saturate;
    for (let row = 0; row < 3; ++row) {
      outFilter[row * 5 + col] = row === col ? diagonalValue : nonDiagonalValue;
    }
  }
  return outFilter;
}

// https://www.w3.org/TR/filter-effects-1/#brightnessEquivalent
// https://www.w3.org/TR/filter-effects-1/#attr-valuedef-type-linear
export function getBrightnessFilter(brightness, outFilter = getNewFilter()) {
  const slope = brightness;
  const intercept = 0;
  return getLinearFilter(slope, intercept, outFilter);
}

// https://www.w3.org/TR/filter-effects-1/#invertEquivalent
// https://www.w3.org/TR/filter-effects-1/#attr-valuedef-type-table
export function getInvertFilter(invert, outFilter = getNewFilter()) {
  const slope = 1 - 2 * invert;
  const intercept = invert;
  return getLinearFilter(slope, intercept, outFilter);
}
