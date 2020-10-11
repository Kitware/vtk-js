export interface T100 {
  MAGNITUDE: number;
  COMPONENT: number;
  RGBCOLORS: number;
}
export const VectorMode: T100;
export interface T101 {
  LUMINANCE: number;
  LUMINANCE_ALPHA: number;
  RGB: number;
  RGBA: number;
}
export const ScalarMappingTarget: T101;
export interface T102 {
  VectorMode: T100;
  ScalarMappingTarget: T101;
}
declare const T103: T102;
export default T103;
