export interface T100 {
  [key: string]: any;
}
declare function extend(publicAPI: any, model: any, initialValues?: T100): void;
export interface T101 {
  CLAMP: number;
  REPEAT: number;
  MIRROR: number;
}
export interface T102 {
  NEAREST: number;
  LINEAR: number;
  CUBIC: number;
}
export interface T103 {
  newInstance: any;
  extend: typeof extend;
  ImageBorderMode: T101;
  InterpolationMode: T102;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T100): void;
export interface T104 {
  newInstance: any;
  extend: typeof extend_1;
}
declare function extend_2(publicAPI: any, model: any, initialValues?: T100): void;
export interface T105 {
  newInstance: any;
  extend: typeof extend_2;
}
declare function extend_3(publicAPI: any, model: any, initialValues?: T100): void;
export interface T106 {
  newInstance: any;
  extend: typeof extend_3;
}
export interface T107 {
  vtkAbstractImageInterpolator: T103;
  vtkImageInterpolator: T104;
  vtkImagePointDataIterator: T105;
  vtkImageReslice: T106;
}
declare const T108: T107;
export default T108;
