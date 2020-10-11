/**
 * Converts a binary buffer in an ArrayBuffer to a string.
 *
 * Note this does not take encoding into consideration, so don't
 * expect proper Unicode or any other encoding.
 */
declare function arrayBufferToString(arrayBuffer: any): string;
export interface T100 {
  text: string;
  binaryBuffer?: any;
}
export interface T101 {
  text: string;
  binaryBuffer: any;
}
/**
 * Extracts binary data out of a file ArrayBuffer given a prefix/suffix.
 */
declare function extractBinary(arrayBuffer: any, prefixRegex: any, suffixRegex?: any): T100 | T101;
export interface T102 {
  arrayBufferToString: typeof arrayBufferToString;
  extractBinary: typeof extractBinary;
}
declare const T103: T102;
export default T103;
