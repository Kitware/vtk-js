declare function computeWorldToDisplay(renderer: any, x: any, y: any, z: any): any;
declare function computeDisplayToWorld(renderer: any, x: any, y: any, z: any): any;
export interface T100 {
  computeWorldToDisplay: typeof computeWorldToDisplay;
  computeDisplayToWorld: typeof computeDisplayToWorld;
}
export const STATIC: T100;
export interface T101 {
  [key: string]: any;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T101): void;
export const extend: typeof extend_1;
export const newInstance: any;
export interface T102 {
  computeWorldToDisplay: typeof computeWorldToDisplay;
  computeDisplayToWorld: typeof computeDisplayToWorld;
  newInstance: any;
  extend: typeof extend_1;
}
declare const T103: T102;
export default T103;
