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
export interface T103 {
  [key: string]: any;
}
declare function get(type?: string, options?: T103): any;
export interface T104 {
  get: typeof get;
}
declare function extend(publicAPI: any, model: any, initialValues?: T103): void;
export interface T105 {
  newInstance: any;
  extend: typeof extend;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T103): void;
declare function applySettings(sceneItem: any, settings: any): void;
declare function updateDatasetTypeMapping(typeName: any, handler: any): void;
export interface T106 {
  newInstance: any;
  extend: typeof extend_1;
  applySettings: typeof applySettings;
  updateDatasetTypeMapping: typeof updateDatasetTypeMapping;
}
declare function extend_2(publicAPI: any, model: any, initialValues?: T103): void;
export interface T107 {
  newInstance: any;
  extend: typeof extend_2;
}
declare function loadScript(url: any): Promise<any>;
declare function loadCSS(url: any): Promise<any>;
export interface T108 {
  loadScript: typeof loadScript;
  loadCSS: typeof loadCSS;
  LOADED_URLS: any[];
}
declare function extend_3(publicAPI: any, model: any, initialValues?: T103): void;
declare function setSmartConnectClass(klass: any): void;
export interface T109 {
  newInstance: any;
  extend: typeof extend_3;
  setSmartConnectClass: typeof setSmartConnectClass;
}
export interface T110 {
  BinaryHelper: T102;
  DataAccessHelper: T104;
  vtkHttpDataSetReader: T105;
  vtkHttpSceneLoader: T106;
  vtkImageStream: T107;
  vtkResourceLoader: T108;
  vtkWSLinkClient: T109;
}
declare function extend_4(publicAPI: any, model: any, initialValues?: T103): void;
export interface T111 {
  extend: typeof extend_4;
  newInstance: any;
}
declare function extend_5(publicAPI: any, model: any, initialValues?: T103): void;
declare function setDracoDecoder(createDracoModule: any): void;
/**
 * Load the WASM decoder from url and set the decoderModule
 * @param url
 * @param binaryName
 * @return {Promise<boolean>}
 */
declare function setWasmBinary(url: any, binaryName: any): Promise<boolean>;
declare function getDracoDecoder(): T103;
export interface T112 {
  extend: typeof extend_5;
  newInstance: any;
  setDracoDecoder: typeof setDracoDecoder;
  setWasmBinary: typeof setWasmBinary;
  getDracoDecoder: typeof getDracoDecoder;
}
declare function writeSTL(polyData: any, format?: any, transform?: any): any;
declare function extend_6(publicAPI: any, model: any, initialValues?: T103): void;
export interface T113 {
  writeSTL: typeof writeSTL;
  newInstance: any;
  extend: typeof extend_6;
}
export interface T114 {
  vtkSTLReader: T111;
  vtkDracoReader: T112;
  vtkSTLWriter: T113;
}
declare function parseLegacyASCII(content: any, dataModel?: T103): T103;
export interface T115 {
  parseLegacyASCII: typeof parseLegacyASCII;
}
declare function extend_7(publicAPI: any, model: any, initialValues?: T103): void;
export interface T116 {
  newInstance: any;
  extend: typeof extend_7;
}
export interface T117 {
  vtkLegacyAsciiParser: T115;
  vtkPolyDataReader: T116;
}
declare function extend_8(publicAPI: any, model: any, initialValues?: T103): void;
export interface T118 {
  newInstance: any;
  extend: typeof extend_8;
}
declare function extend_9(publicAPI: any, model: any, initialValues?: T103): void;
declare function setReadImageArrayBufferFromITK(fn: any): void;
export interface T119 {
  newInstance: any;
  extend: typeof extend_9;
  setReadImageArrayBufferFromITK: typeof setReadImageArrayBufferFromITK;
}
declare function extend_10(publicAPI: any, model: any, initialValues?: T103): void;
declare function setReadPolyDataArrayBufferFromITK(fn: any): void;
export interface T120 {
  newInstance: any;
  extend: typeof extend_10;
  setReadPolyDataArrayBufferFromITK: typeof setReadPolyDataArrayBufferFromITK;
}
declare function extend_11(publicAPI: any, model: any, initialValues?: T103): void;
export interface T121 {
  newInstance: any;
  extend: typeof extend_11;
}
declare function extend_12(publicAPI: any, model: any, initialValues?: T103): void;
export interface T122 {
  newInstance: any;
  extend: typeof extend_12;
}
declare function extend_13(publicAPI: any, model: any, initialValues?: T103): void;
export interface T123 {
  newInstance: any;
  extend: typeof extend_13;
}
declare function extend_14(publicAPI: any, model: any, initialValues?: T103): void;
export interface T124 {
  newInstance: any;
  extend: typeof extend_14;
}
declare function extend_15(publicAPI: any, model: any, initialValues?: T103): void;
export interface T125 {
  newInstance: any;
  extend: typeof extend_15;
}
declare function extend_16(publicAPI: any, model: any, initialValues?: T103): void;
export interface T126 {
  newInstance: any;
  extend: typeof extend_16;
}
export interface T127 {
  vtkElevationReader: T118;
  vtkITKImageReader: T119;
  vtkITKPolyDataReader: T120;
  vtkJSONNucleoReader: T121;
  vtkJSONReader: T122;
  vtkMTLReader: T123;
  vtkOBJReader: T124;
  vtkPDBReader: T125;
  vtkSkyboxReader: T126;
}
declare function extend_17(publicAPI: any, model: any, initialValues?: T103): void;
export interface T128 {
  newInstance: any;
  extend: typeof extend_17;
}
declare function extend_18(publicAPI: any, model: any, initialValues?: T103): void;
export interface T129 {
  newInstance: any;
  extend: typeof extend_18;
}
declare function extend_19(publicAPI: any, model: any, initialValues?: T103): void;
export interface T130 {
  newInstance: any;
  extend: typeof extend_19;
}
declare function extend_20(publicAPI: any, model: any, initialValues?: T103): void;
export interface T131 {
  newInstance: any;
  extend: typeof extend_20;
}
declare function extend_21(publicAPI: any, model: any, initialValues?: T103): void;
export interface T132 {
  name: any;
  values: any;
  numberOfComponents: number;
}
declare function processDataArray(size: any, dataArrayElem: any, compressor: any, byteOrder: any, headerType: any, binaryBuffer: any): T132;
declare function processFieldData(size: any, fieldElem: any, fieldContainer: any, compressor: any, byteOrder: any, headerType: any, binaryBuffer: any): void;
declare function processCells(size: any, containerElem: any, compressor: any, byteOrder: any, headerType: any, binaryBuffer: any): Uint32Array;
export interface T133 {
  extend: typeof extend_21;
  processDataArray: typeof processDataArray;
  processFieldData: typeof processFieldData;
  processCells: typeof processCells;
}
declare function extend_22(publicAPI: any, model: any, initialValues?: T103): void;
declare function compressBlock(uncompressed: any): any;
declare function processDataArray_1(dataArray: any, format: any, blockSize: any, compressor?: string): any;
export interface T134 {
  extend: typeof extend_22;
  compressBlock: typeof compressBlock;
  processDataArray: typeof processDataArray_1;
  FormatTypes: any;
}
export interface T135 {
  vtkXMLImageDataReader: T128;
  vtkXMLImageDataWriter: T129;
  vtkXMLPolyDataReader: T130;
  vtkXMLPolyDataWriter: T131;
  vtkXMLReader: T133;
  vtkXMLWriter: T134;
}
export interface T136 {
  Core: T110;
  Geometry: T114;
  Legacy: T117;
  Misc: T127;
  XML: T135;
}
declare const T137: T136;
export default T137;
