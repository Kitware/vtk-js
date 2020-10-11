declare function computeNormalDirection(v1: any, v2: any, v3: any, n: any): void;
declare function computeNormal(v1: any, v2: any, v3: any, n: any): void;
export interface T100 {
  computeNormalDirection: typeof computeNormalDirection;
  computeNormal: typeof computeNormal;
}
export const STATIC: T100;
export interface T101 {
  [key: string]: any;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T101): void;
export const extend: typeof extend_1;
export const newInstance: any;
export interface T102 {
  computeNormalDirection: typeof computeNormalDirection;
  computeNormal: typeof computeNormal;
  newInstance: any;
  extend: typeof extend_1;
}
declare const T103: T102;
export default T103;
