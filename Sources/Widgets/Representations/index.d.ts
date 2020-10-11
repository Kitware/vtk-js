export interface T100 {
  [key: string]: any;
}
declare function extend(publicAPI: any, model: any, initialValues?: T100): void;
export interface T101 {
  newInstance: any;
  extend: typeof extend;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T100): void;
export interface T102 {
  extend: typeof extend_1;
}
declare function extend_2(publicAPI: any, model: any, initialValues?: T100): void;
export interface T103 {
  newInstance: any;
  extend: typeof extend_2;
}
declare function extend_3(publicAPI: any, model: any, initialValues?: T100): void;
export interface T104 {
  newInstance: any;
  extend: typeof extend_3;
}
declare function extend_4(publicAPI: any, model: any, initialValues?: T100): void;
export interface T105 {
  extend: typeof extend_4;
}
declare function extend_5(publicAPI: any, model: any, initialValues?: T100): void;
declare function generateState(): any;
export interface T106 {
  newInstance: any;
  extend: typeof extend_5;
  generateState: typeof generateState;
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
declare function extend_9(publicAPI: any, model: any, initialValues?: T100): void;
export interface T110 {
  active: T100;
  inactive: T100;
  static: T100;
}
declare function mergeStyles(elementNames: any, ...stylesToMerge: any[]): T110;
declare function applyStyles(pipelines: any, styles: any, activeActor: any): void;
declare function connectPipeline(pipeline: any): void;
export interface T111 {
  extend: typeof extend_9;
  mergeStyles: typeof mergeStyles;
  applyStyles: typeof applyStyles;
  connectPipeline: typeof connectPipeline;
}
export interface T112 {
  vtkCircleContextRepresentation: T101;
  vtkContextRepresentation: T102;
  vtkConvexFaceContextRepresentation: T103;
  vtkCubeHandleRepresentation: T104;
  vtkHandleRepresentation: T105;
  vtkImplicitPlaneRepresentation: T106;
  vtkOutlineContextRepresentation: T107;
  vtkPolyLineRepresentation: T108;
  vtkSphereHandleRepresentation: T109;
  vtkWidgetRepresentation: T111;
}
declare const T113: T112;
export default T113;
