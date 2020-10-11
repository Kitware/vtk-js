export interface T100 {
  ASCII: string;
  BINARY: string;
  APPENDED: string;
}
export const FormatTypes: T100;
export interface T101 {
  Int8Array: string;
  Uint8Array: string;
  Int16Array: string;
  Uint16Array: string;
  Int32Array: string;
  Uint32Array: string;
  Float32Array: string;
  Float64Array: string;
}
export const TYPED_ARRAY: T101;
export interface T102 {
  FormatTypes: T100;
}
declare const T103: T102;
export default T103;
