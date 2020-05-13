/**
 * Method that take a base64 string and return an ArrayBuffer.
 * This method properly handle input string with spaces and new lines.
 *
 * @param base64Str
 * @returns ArrayBuffer of corresponding binary data
 */
declare function toArrayBuffer(base64Str: string): ArrayBuffer;

export default {
  toArrayBuffer,
};
