declare function evaluate(radius: any, center: any, axis: any, x: any): number;
export interface T100 {
  evaluate: typeof evaluate;
}
export const STATIC: T100;
export interface T101 {
  [key: string]: any;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T101): void;
export const extend: typeof extend_1;
export const newInstance: any;
export interface T102 {
  evaluate: typeof evaluate;
  newInstance: any;
  extend: typeof extend_1;
}
declare const T103: T102;
export default T103;
