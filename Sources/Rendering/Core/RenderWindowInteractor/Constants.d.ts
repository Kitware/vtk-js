export interface T100 {
  Unknown: number;
  LeftController: number;
  RightController: number;
}
export const Device: T100;
export interface T101 {
  Unknown: number;
  Trigger: number;
  TrackPad: number;
  Grip: number;
  ApplicationMenu: number;
}
export const Input: T101;
export interface T102 {
  Device: T100;
  Input: T101;
}
declare const T103: T102;
export default T103;
