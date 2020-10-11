export interface T100 {
  [key: string]: any;
}
declare function extend(publicAPI: any, model: any, initialValues?: T100): void;
export interface T101 {
  replace: boolean;
  result: any;
}
declare function substitute(source: any, search: any, replace: any, all?: boolean): T101;
export interface T102 {
  newInstance: any;
  extend: typeof extend;
  substitute: typeof substitute;
}
declare const T103: T102;
export default T103;
