export interface T100 {
  [key: string]: any;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T100): void;
export const extend: typeof extend_1;
export interface T101 {
  name: any;
  values: any;
  numberOfComponents: number;
}
declare function processDataArray(size: any, dataArrayElem: any, compressor: any, byteOrder: any, headerType: any, binaryBuffer: any): T101;
declare function processFieldData(size: any, fieldElem: any, fieldContainer: any, compressor: any, byteOrder: any, headerType: any, binaryBuffer: any): void;
declare function processCells(size: any, containerElem: any, compressor: any, byteOrder: any, headerType: any, binaryBuffer: any): Uint32Array;
export interface T102 {
  extend: typeof extend_1;
  processDataArray: typeof processDataArray;
  processFieldData: typeof processFieldData;
  processCells: typeof processCells;
}
declare const T103: T102;
export default T103;
