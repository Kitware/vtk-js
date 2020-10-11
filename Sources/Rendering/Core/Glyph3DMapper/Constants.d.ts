export interface T100 {
  DIRECTION: number;
  ROTATION: number;
  MATRIX: number;
}
export const OrientationModes: T100;
export interface T101 {
  SCALE_BY_CONSTANT: number;
  SCALE_BY_MAGNITUDE: number;
  SCALE_BY_COMPONENTS: number;
}
export const ScaleModes: T101;
export interface T102 {
  OrientationModes: T100;
  ScaleModes: T101;
}
declare const T103: T102;
export default T103;
