/**
 * Helper class to convert to/from half float
 */

/**
 * Convert a number to half float representation
 * @param {number} input
 * @return encoded half float number (16 bits)
 */
declare function toHalf(input: number): number;

/**
 * Check whether a number is finite and beyond the half float range, so that
 * toHalfClamped clamps it.
 * @param {number} input
 */
declare function needsHalfFloatClamp(input: number): boolean;

/**
 * Convert a number to half float representation, clamping finite values
 * beyond the half float range to the largest finite half float of the same
 * sign instead of converting them to infinity. Infinity and NaN are
 * converted unchanged.
 * @param {number} input
 * @return encoded half float number (16 bits)
 */
declare function toHalfClamped(input: number): number;

/**
 * Convert a half float representation to a number
 * @param {number} input
 * @return decoded half float number
 */
declare function fromHalf(input: number): number;

declare const HalfFloat: {
  /** The largest finite half float value, 65504. */
  MAX_FINITE_HALF_FLOAT: number;
  needsHalfFloatClamp: typeof needsHalfFloatClamp;
  toHalf: typeof toHalf;
  toHalfClamped: typeof toHalfClamped;
  fromHalf: typeof fromHalf;
};

export default HalfFloat;
