declare function trackballRotate_1(prevX: any, prevY: any, curX: any, curY: any, origin: any, direction: any, renderer: any, glRenderWindow: any): number[];
export const trackballRotate: typeof trackballRotate_1;
export interface T100 {
  [key: string]: any;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T100): void;
export const extend: typeof extend_1;
export const newInstance: any;
export interface T101 {
  trackballRotate: typeof trackballRotate_1;
  extend: typeof extend_1;
  newInstance: any;
}
declare const T102: T101;
export default T102;
