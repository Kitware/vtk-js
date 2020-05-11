export function extend(publicAPI: any, model: any, initialValues?: {}): void;
declare namespace _default {
    export { extend };
    export { processDataArray };
    export { processFieldData };
    export { processCells };
}
export default _default;
declare function processDataArray(size: any, dataArrayElem: any, compressor: any, byteOrder: any, headerType: any, binaryBuffer: any): {
    name: any;
    values: any;
    numberOfComponents: number;
};
declare function processFieldData(size: any, fieldElem: any, fieldContainer: any, compressor: any, byteOrder: any, headerType: any, binaryBuffer: any): void;
declare function processCells(size: any, containerElem: any, compressor: any, byteOrder: any, headerType: any, binaryBuffer: any): Uint32Array;
