export interface T100 {
  [key: string]: any;
}
declare function extend(publicAPI: any, model: any, initialValues?: T100): void;
export interface T101 {
  newInstance: any;
  extend: typeof extend;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T100): void;
declare function setReadImageArrayBufferFromITK(fn: any): void;
export interface T102 {
  newInstance: any;
  extend: typeof extend_1;
  setReadImageArrayBufferFromITK: typeof setReadImageArrayBufferFromITK;
}
declare function extend_2(publicAPI: any, model: any, initialValues?: T100): void;
declare function setReadPolyDataArrayBufferFromITK(fn: any): void;
export interface T103 {
  newInstance: any;
  extend: typeof extend_2;
  setReadPolyDataArrayBufferFromITK: typeof setReadPolyDataArrayBufferFromITK;
}
declare function extend_3(publicAPI: any, model: any, initialValues?: T100): void;
export interface T104 {
  newInstance: any;
  extend: typeof extend_3;
}
declare function extend_4(publicAPI: any, model: any, initialValues?: T100): void;
export interface T105 {
  newInstance: any;
  extend: typeof extend_4;
}
declare function extend_5(publicAPI: any, model: any, initialValues?: T100): void;
export interface T106 {
  newInstance: any;
  extend: typeof extend_5;
}
declare function extend_6(publicAPI: any, model: any, initialValues?: T100): void;
export interface T107 {
  newInstance: any;
  extend: typeof extend_6;
}
declare function extend_7(publicAPI: any, model: any, initialValues?: T100): void;
export interface T108 {
  newInstance: any;
  extend: typeof extend_7;
}
declare function extend_8(publicAPI: any, model: any, initialValues?: T100): void;
export interface T109 {
  newInstance: any;
  extend: typeof extend_8;
}
export interface T110 {
  vtkElevationReader: T101;
  vtkITKImageReader: T102;
  vtkITKPolyDataReader: T103;
  vtkJSONNucleoReader: T104;
  vtkJSONReader: T105;
  vtkMTLReader: T106;
  vtkOBJReader: T107;
  vtkPDBReader: T108;
  vtkSkyboxReader: T109;
}
declare const T111: T110;
export default T111;
