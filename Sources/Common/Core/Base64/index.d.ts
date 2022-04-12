/**
 * Base64 helper to process base64 strings.
 */

/**
 * Convert a Base64 string to an ArrayBuffer.
 * @param {string} b64Str
 * @return An ArrayBuffer object.
 */
export function toArrayBuffer(b64Str: string): ArrayBuffer;

/**
 * Convert a Base64 string to an ArrayBuffer.
 * @param {string} b64Str
 * @return An ArrayBuffer object.
 */
export function fromArrayBuffer(ab: ArrayBuffer): string;

interface Base64 {
  toArrayBuffer,
  fromArrayBuffer,
}

export default Base64;
