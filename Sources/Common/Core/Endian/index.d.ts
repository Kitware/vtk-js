import { Nullable } from '../../../types';

/**
 * Get the endianness
 */
export function getEndianness(): Nullable<string>;

export const ENDIANNESS: Nullable<string>;

/**
 *
 * @param {ArrayBuffer} buffer
 * @param {Number} wordSize
 */
export function swapBytes(buffer: ArrayBuffer, wordSize: number): void;

declare const _default: {
  ENDIANNESS: Nullable<string>;
  getEndianness: typeof getEndianness;
  swapBytes: typeof swapBytes;
};
export default _default;
