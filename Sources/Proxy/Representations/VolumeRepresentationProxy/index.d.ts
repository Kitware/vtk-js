export interface T100 {
  [key: string]: any;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T100): void;
export const extend: typeof extend_1;
export const newInstance: any;
export interface T102 {
  mapper: any;
  property: any;
}
declare function updateConfiguration(dataset: any, dataArray: any, T101: T102): void;
export interface T103 {
  newInstance: any;
  extend: typeof extend_1;
  updateConfiguration: typeof updateConfiguration;
}
declare const T104: T103;
export default T104;
