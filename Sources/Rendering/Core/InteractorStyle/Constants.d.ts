export interface T100 {
  IS_START: number;
  IS_NONE: number;
  IS_ROTATE: number;
  IS_PAN: number;
  IS_SPIN: number;
  IS_DOLLY: number;
  IS_CAMERA_POSE: number;
  IS_WINDOW_LEVEL: number;
  IS_SLICE: number;
}
export const States: T100;
export interface T101 {
  States: T100;
}
declare const T102: T101;
export default T102;
