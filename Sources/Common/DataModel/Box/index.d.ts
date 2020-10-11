declare function intersectBox(bounds: any, origin: any, dir: any, coord: any, tolerance: any): number | number;
declare function intersectPlane(bounds: any, origin: any, normal: any): number | number;
export interface T100 {
  intersectBox: typeof intersectBox;
  intersectPlane: typeof intersectPlane;
}
export const STATIC: T100;
export interface T101 {
  [key: string]: any;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T101): void;
export const extend: typeof extend_1;
export const newInstance: any;
export interface T102 {
  intersectBox: typeof intersectBox;
  intersectPlane: typeof intersectPlane;
  newInstance: any;
  extend: typeof extend_1;
}
declare const T103: T102;
export default T103;
