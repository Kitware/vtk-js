export const LIGHT_TYPES: string[];
export interface T100 {
  [key: string]: any;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T100): void;
export const extend: typeof extend_1;
export const newInstance: any;
export interface T101 {
  newInstance: any;
  extend: typeof extend_1;
  LIGHT_TYPES: string[];
}
declare const T102: T101;
export default T102;
