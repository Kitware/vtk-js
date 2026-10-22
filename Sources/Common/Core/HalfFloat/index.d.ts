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
 * Convert a half float representation to a number
 * @param {number} input
 * @return decoded half float number
 */
declare function fromHalf(input: number): number;

declare const HalfFloat: {
  toHalf: typeof toHalf;
  fromHalf: typeof fromHalf;
};

export default HalfFloat;
