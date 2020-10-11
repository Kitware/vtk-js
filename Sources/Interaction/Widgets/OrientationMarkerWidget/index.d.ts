export interface T100 {
  viewportCorner: any;
  viewportSize: number;
  minPixelSize: number;
  maxPixelSize: number;
}
export const DEFAULT_VALUES: T100;
export interface T101 {
  [key: string]: any;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T101): void;
export const extend: typeof extend_1;
export const newInstance: any;
declare const T102: any;
export default T102;
