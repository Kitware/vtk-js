export interface T100 {
  [key: string]: any;
}
declare function extend(publicAPI: any, model: any, initialValues?: T100): void;
export interface T101 {
  extend: typeof extend;
  newInstance: any;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T100): void;
declare function setDracoDecoder(createDracoModule: any): void;
/**
 * Load the WASM decoder from url and set the decoderModule
 * @param url
 * @param binaryName
 * @return {Promise<boolean>}
 */
declare function setWasmBinary(url: any, binaryName: any): Promise<boolean>;
declare function getDracoDecoder(): T100;
export interface T102 {
  extend: typeof extend_1;
  newInstance: any;
  setDracoDecoder: typeof setDracoDecoder;
  setWasmBinary: typeof setWasmBinary;
  getDracoDecoder: typeof getDracoDecoder;
}
declare function writeSTL(polyData: any, format?: any, transform?: any): any;
declare function extend_2(publicAPI: any, model: any, initialValues?: T100): void;
export interface T103 {
  writeSTL: typeof writeSTL;
  newInstance: any;
  extend: typeof extend_2;
}
export interface T104 {
  vtkSTLReader: T101;
  vtkDracoReader: T102;
  vtkSTLWriter: T103;
}
declare const T105: T104;
export default T105;
