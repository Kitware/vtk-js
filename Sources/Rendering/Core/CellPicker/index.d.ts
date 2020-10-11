export interface T100 {
  planeId: number;
  t1: number;
  t2: number;
  intersect: number;
}
declare function clipLineWithPlane(mapper: any, matrix: any, p1: any, p2: any): number | T100;
export interface T101 {
  clipLineWithPlane: typeof clipLineWithPlane;
}
export const STATIC: T101;
export interface T102 {
  [key: string]: any;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T102): void;
export const extend: typeof extend_1;
export const newInstance: any;
export interface T103 {
  clipLineWithPlane: typeof clipLineWithPlane;
  newInstance: any;
  extend: typeof extend_1;
}
declare const T104: T103;
export default T104;
