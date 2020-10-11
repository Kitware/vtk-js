export interface T100 {
  tipResolution: number;
  tipRadius: number;
  tipLength: number;
  shaftResolution: number;
  shaftRadius: number;
  invert: boolean;
}
export interface T101 {
  config: T100;
  xAxisColor: number[];
  yAxisColor: number[];
  zAxisColor: number[];
}
export const DEFAULT_VALUES: T101;
export interface T102 {
  [key: string]: any;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T102): void;
export const extend: typeof extend_1;
export const newInstance: any;
export interface T103 {
  newInstance: any;
  extend: typeof extend_1;
}
declare const T104: T103;
export default T104;
