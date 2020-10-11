export interface T100 {
  [key: string]: any;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T100): void;
export const extend: typeof extend_1;
declare function compressBlock(uncompressed: any): any;
declare function processDataArray(dataArray: any, format: any, blockSize: any, compressor?: string): any;
export interface T101 {
  extend: typeof extend_1;
  compressBlock: typeof compressBlock;
  processDataArray: typeof processDataArray;
  FormatTypes: any;
}
declare const T102: T101;
export default T102;
