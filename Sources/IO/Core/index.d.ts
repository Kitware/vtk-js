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
declare const T111: T110;
export default T111;
