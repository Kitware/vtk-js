export interface T100 {
  RGB: number;
  HSV: number;
  LAB: number;
  DIVERGING: number;
}
export const ColorSpace: T100;
export interface T101 {
  LINEAR: number;
  LOG10: number;
}
export const Scale: T101;
export interface T102 {
  ColorSpace: T100;
  Scale: T101;
}
declare const T103: T102;
export default T103;
