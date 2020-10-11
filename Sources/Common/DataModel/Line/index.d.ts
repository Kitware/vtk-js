export interface T100 {
  t: number;
  distance: number;
}
declare function distanceToLine(x: any, p1: any, p2: any, closestPoint?: any): T100;
declare function intersection(a1: any, a2: any, b1: any, b2: any, u: any, v: any): any;
export interface T101 {
  distanceToLine: typeof distanceToLine;
  intersection: typeof intersection;
}
export const STATIC: T101;
export interface T102 {
  [key: string]: any;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T102): void;
export const extend: typeof extend_1;
export const newInstance: any;
declare const T103: any;
export default T103;
