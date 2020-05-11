declare namespace _default {
    export { arrayBufferToString };
    export { extractBinary };
}
export default _default;
/**
 * Converts a binary buffer in an ArrayBuffer to a string.
 *
 * Note this does not take encoding into consideration, so don't
 * expect proper Unicode or any other encoding.
 */
declare function arrayBufferToString(arrayBuffer: any): string;
/**
 * Extracts binary data out of a file ArrayBuffer given a prefix/suffix.
 */
declare function extractBinary(arrayBuffer: any, prefixRegex: any, suffixRegex?: any): {
    text: string;
    binaryBuffer?: undefined;
} | {
    text: string;
    binaryBuffer: any;
};
