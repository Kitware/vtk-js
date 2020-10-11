export interface T100 {
  [key: string]: any;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T100): void;
export const extend: typeof extend_1;
export const newInstance: any;
declare function setDracoDecoder(createDracoModule: any): void;
/**
 * Load the WASM decoder from url and set the decoderModule
 * @param url
 * @param binaryName
 * @return {Promise<boolean>}
 */
declare function setWasmBinary(url: any, binaryName: any): Promise<boolean>;
declare function getDracoDecoder(): T100;
export interface T101 {
  extend: typeof extend_1;
  newInstance: any;
  setDracoDecoder: typeof setDracoDecoder;
  setWasmBinary: typeof setWasmBinary;
  getDracoDecoder: typeof getDracoDecoder;
}
declare const T102: T101;
export default T102;
