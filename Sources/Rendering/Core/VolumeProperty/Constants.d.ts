export interface T100 {
  NEAREST: number;
  LINEAR: number;
  FAST_LINEAR: number;
}
export const InterpolationType: T100;
export interface T101 {
  FRACTIONAL: number;
  PROPORTIONAL: number;
}
export const OpacityMode: T101;
export interface T102 {
  InterpolationType: T100;
  OpacityMode: T101;
}
declare const T103: T102;
export default T103;
