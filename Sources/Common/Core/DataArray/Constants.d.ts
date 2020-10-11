export interface T100 {
  Int8Array: number;
  Uint8Array: number;
  Uint8ClampedArray: number;
  Int16Array: number;
  Uint16Array: number;
  Int32Array: number;
  Uint32Array: number;
  Float32Array: number;
  Float64Array: number;
}
export const DataTypeByteSize: T100;
export interface T101 {
  VOID: string;
  CHAR: string;
  SIGNED_CHAR: string;
  UNSIGNED_CHAR: string;
  SHORT: string;
  UNSIGNED_SHORT: string;
  INT: string;
  UNSIGNED_INT: string;
  FLOAT: string;
  DOUBLE: string;
}
export const VtkDataTypes: T101;
export const DefaultDataType: string;
export interface T102 {
  DefaultDataType: string;
  DataTypeByteSize: T100;
  VtkDataTypes: T101;
}
declare const T103: T102;
export default T103;
