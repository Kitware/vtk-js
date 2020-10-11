declare function intersectDisplayWithPlane_1(x: any, y: any, planeOrigin: any, planeNormal: any, renderer: any, glRenderWindow: any): any;
export const intersectDisplayWithPlane: typeof intersectDisplayWithPlane_1;
export interface T100 {
  [key: string]: any;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T100): void;
export const extend: typeof extend_1;
export const newInstance: any;
export interface T101 {
  intersectDisplayWithPlane: typeof intersectDisplayWithPlane_1;
  extend: typeof extend_1;
  newInstance: any;
}
declare const T102: T101;
export default T102;
