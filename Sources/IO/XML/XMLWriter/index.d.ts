export function extend(publicAPI: any, model: any, initialValues?: {}): void;
declare namespace _default {
    export { extend };
    export { compressBlock };
    export { processDataArray };
    export { FormatTypes };
}
export default _default;
declare function compressBlock(uncompressed: any): any;
declare function processDataArray(dataArray: any, format: any, blockSize: any, compressor?: string): any;
