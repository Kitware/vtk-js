export interface T100 {
  renderer: any;
  renderWindow: any;
  interactor: any;
  openGLRenderWindow: any;
  camera: any;
}
declare function extractRenderingComponents_1(renderer: any): T100;
export const extractRenderingComponents: typeof extractRenderingComponents_1;
export interface T101 {
  [key: string]: any;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T101): void;
export const extend: typeof extend_1;
export const newInstance: any;
export interface T102 {
  newInstance: any;
  extend: typeof extend_1;
  Constants: any;
}
declare const T103: T102;
export default T103;
