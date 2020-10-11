export interface T100 {
  [key: string]: any;
}
declare function parseLegacyASCII(content: any, dataModel?: T100): T100;
export interface T101 {
  parseLegacyASCII: typeof parseLegacyASCII;
}
declare function extend(publicAPI: any, model: any, initialValues?: T100): void;
export interface T102 {
  newInstance: any;
  extend: typeof extend;
}
export interface T103 {
  vtkLegacyAsciiParser: T101;
  vtkPolyDataReader: T102;
}
declare const T104: T103;
export default T104;
