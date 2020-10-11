export interface T100 {
  CLAMP: number;
  REPEAT: number;
  MIRROR: number;
}
export const ImageBorderMode: T100;
export interface T101 {
  NEAREST: number;
  LINEAR: number;
  CUBIC: number;
}
export const InterpolationMode: T101;
export interface T102 {
  ImageBorderMode: T100;
  InterpolationMode: T101;
}
declare const T103: T102;
export default T103;
