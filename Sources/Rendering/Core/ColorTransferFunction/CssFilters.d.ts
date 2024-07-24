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

import { Matrix, Vector3 } from '../../../types';

export const luminanceWeights: Vector3;
export type FilterMatrix = Matrix;

/**
 * Create a new filter matrix
 * This is a 5x5 row major array
 * Use applyFilter() function to use it
 * It is NOT the identity
 */
export function createCSSFilter(): FilterMatrix;

/**
 * Convert a filter to an identity matrix or create a new identity filter
 * @param outFilter If specified, the outFilter is converted to identity filter
 */
export function createIdentityFilter(outFilter?: FilterMatrix): FilterMatrix;

/**
 * Combine two filters into a single filter
 * Warning: it is NOT an operation inspired by CSS filters
 * For this, apply filters one by one using applyFilter
 * The clamping step is not applied between each filter when the filters are combined
 * The order of the filters matters
 * @param baseFilter The first filter that will be applied
 * @param newFilter The second filter that will be applied
 * @param outFilter An optional filter that will contain the combined filter
 */
export function combineFilters(
  baseFilter: FilterMatrix,
  newFilter: FilterMatrix,
  outFilter?: FilterMatrix
): FilterMatrix;

/**
 * Apply a filter to a rgb(a) point
 * It is a multiplication by the matrix and a clamping
 * @param filter The filter
 * @param r The red channel (between 0 and 1)
 * @param g The green channel (between 0 and 1)
 * @param b The blue channel (between 0 and 1)
 * @param a The optional alpha channel (between 0 and 1), defaults to 1
 * @returns A vector of size 4 [r, g, b, a]
 */
export function applyFilter(
  filter: FilterMatrix,
  r: number,
  g: number,
  b: number,
  a?: number
): [number, number, number, number];

/**
 * A generic linear filter
 * See svg equivalent for parameters and a specification
 * https://www.w3.org/TR/filter-effects-1/#attr-valuedef-type-linear
 * @param slope
 * @param intercept
 * @param outFilter Optional output, a new filter is created if not specified
 */
export function createLinearFilter(
  slope: number,
  intercept: number,
  outFilter?: FilterMatrix
): FilterMatrix;

/**
 * A contrast filter
 * See css/svg equivalent for parameters and a specification
 * https://www.w3.org/TR/filter-effects-1/#contrastEquivalent
 * https://www.w3.org/TR/filter-effects-1/#attr-valuedef-type-linear
 * @param contrast
 * @param outFilter Optional output, a new filter is created if not specified
 */
export function createContrastFilter(
  contrast: number,
  outFilter?: FilterMatrix
): FilterMatrix;

/**
 * A saturate filter
 * See css/svg equivalent for parameters and a specification
 * https://www.w3.org/TR/filter-effects-1/#saturateEquivalent
 * https://www.w3.org/TR/filter-effects-1/#ref-for-attr-valuedef-type-saturate
 * @param saturate
 * @param outFilter Optional output, a new filter is created if not specified
 */
export function createSaturateFilter(
  saturate: number,
  outFilter?: FilterMatrix
): FilterMatrix;

/**
 * A brightness filter
 * See css/svg equivalent for parameters and a specification
 * https://www.w3.org/TR/filter-effects-1/#brightnessEquivalent
 * https://www.w3.org/TR/filter-effects-1/#attr-valuedef-type-linear
 * @param brightness
 * @param outFilter Optional output, a new filter is created if not specified
 */
export function createBrightnessFilter(
  brightness: number,
  outFilter?: FilterMatrix
): FilterMatrix;

/**
 * An invert filter
 * See css/svg equivalent for parameters and a specification
 * https://www.w3.org/TR/filter-effects-1/#invertEquivalent
 * https://www.w3.org/TR/filter-effects-1/#attr-valuedef-type-table
 * @param invert
 * @param outFilter Optional output, a new filter is created if not specified
 */
export function createInvertFilter(
  invert: number,
  outFilter?: FilterMatrix
): FilterMatrix;
