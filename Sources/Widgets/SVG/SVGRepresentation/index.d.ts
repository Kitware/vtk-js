export interface T100 {
  [key: string]: any;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T100): void;
export const extend: typeof extend_1;
export interface T101 {
  name: any;
  attrs: T100;
  textContent: any;
  children: any[];
  setAttribute(attr: any, val: any): void;
  removeAttribute(attr: any): void;
  appendChild(n: any): void;
}
declare function createSvgElement(tag: any): T101;
declare function createSvgDomElement(tag: any): any;
export interface T102 {
  extend: typeof extend_1;
  createSvgElement: typeof createSvgElement;
  createSvgDomElement: typeof createSvgDomElement;
}
declare const T103: T102;
export default T103;
