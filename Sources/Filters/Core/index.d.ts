export interface T100 {
  [key: string]: any;
}
declare function extend(publicAPI: any, model: any, initialValues?: T100): void;
export interface T101 {
  newInstance: any;
  extend: typeof extend;
}
export interface T102 {
  vtkCutter: T101;
}
declare const T103: T102;
export default T103;
