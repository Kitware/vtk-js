export interface T100 {
  [key: string]: any;
}
declare function extend(publicAPI: any, model: any, initialValues?: T100): void;
export interface T101 {
  newInstance: any;
  extend: typeof extend;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T100): void;
export interface T102 {
  newInstance: any;
  extend: typeof extend_1;
}
declare function extend_2(publicAPI: any, model: any, initialValues?: T100): void;
export interface T103 {
  newInstance: any;
  extend: typeof extend_2;
}
declare function extend_3(publicAPI: any, model: any, initialValues?: T100): void;
export interface T104 {
  newInstance: any;
  extend: typeof extend_3;
}
declare function extend_4(publicAPI: any, model: any, initialValues?: T100): void;
export interface T105 {
  name: any;
  values: any;
  numberOfComponents: number;
}
declare function processDataArray(size: any, dataArrayElem: any, compressor: any, byteOrder: any, headerType: any, binaryBuffer: any): T105;
declare function processFieldData(size: any, fieldElem: any, fieldContainer: any, compressor: any, byteOrder: any, headerType: any, binaryBuffer: any): void;
declare function processCells(size: any, containerElem: any, compressor: any, byteOrder: any, headerType: any, binaryBuffer: any): Uint32Array;
export interface T106 {
  extend: typeof extend_4;
  processDataArray: typeof processDataArray;
  processFieldData: typeof processFieldData;
  processCells: typeof processCells;
}
declare function extend_5(publicAPI: any, model: any, initialValues?: T100): void;
declare function compressBlock(uncompressed: any): any;
declare function processDataArray_1(dataArray: any, format: any, blockSize: any, compressor?: string): any;
export interface T107 {
  extend: typeof extend_5;
  compressBlock: typeof compressBlock;
  processDataArray: typeof processDataArray_1;
  FormatTypes: any;
}
export interface T108 {
  vtkXMLImageDataReader: T101;
  vtkXMLImageDataWriter: T102;
  vtkXMLPolyDataReader: T103;
  vtkXMLPolyDataWriter: T104;
  vtkXMLReader: T106;
  vtkXMLWriter: T107;
}
declare const T109: T108;
export default T109;
