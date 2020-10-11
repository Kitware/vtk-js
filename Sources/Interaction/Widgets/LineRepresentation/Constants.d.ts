export interface T100 {
  OUTSIDE: number;
  ONP1: number;
  ONP2: number;
  TRANSLATINGP1: number;
  TRANSLATINGP2: number;
  ONLINE: number;
  SCALING: number;
}
export const State: T100;
export interface T101 {
  NONE: number;
  X: number;
  Y: number;
  Z: number;
}
export const Restrict: T101;
export interface T102 {
  State: T100;
  Restrict: T101;
}
declare const T103: T102;
export default T103;
