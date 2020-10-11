export interface T100 {
  CLAMP_TO_EDGE: number;
  REPEAT: number;
  MIRRORED_REPEAT: number;
}
export const Wrap: T100;
export interface T101 {
  NEAREST: number;
  LINEAR: number;
  NEAREST_MIPMAP_NEAREST: number;
  NEAREST_MIPMAP_LINEAR: number;
  LINEAR_MIPMAP_NEAREST: number;
  LINEAR_MIPMAP_LINEAR: number;
}
export const Filter: T101;
export interface T102 {
  Wrap: T100;
  Filter: T101;
}
declare const T103: T102;
export default T103;
