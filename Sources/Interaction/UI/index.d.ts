export interface T100 {
  [key: string]: any;
}
declare function extend(publicAPI: any, model: any, initialValues?: T100): void;
declare function applyTemplate(template: any, map: any, fallback: any): any;
export interface T101 {
  newInstance: any;
  extend: typeof extend;
  applyTemplate: typeof applyTemplate;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T100): void;
export interface T102 {
  newInstance: any;
  extend: typeof extend_1;
}
export interface T103 {
  Contrast: any;
  Logo: any;
  Spacing: any;
  Tint: any;
}
declare function extend_2(publicAPI: any, model: any, initialValues?: T100): void;
export interface T104 {
  newInstance: any;
  extend: typeof extend_2;
}
export interface T105 {
  vtkCornerAnnotation: T101;
  vtkFPSMonitor: T102;
  vtkIcons: T103;
  vtkSlider: any;
  vtkVolumeController: T104;
}
declare const T106: T105;
export default T106;
