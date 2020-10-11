export interface T100 {
  ncells: number;
  cells: any;
}
export const InitLink: T100;
export interface T101 {
  [key: string]: any;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T101): void;
export const extend: typeof extend_1;
export const newInstance: any;
export interface T102 {
  newInstance: any;
  extend: typeof extend_1;
}
declare const T103: T102;
export default T103;
