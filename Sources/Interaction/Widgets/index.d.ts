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
  newInstance: any;
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
declare function applyGaussianToPiecewiseFunction(gaussians: any, sampling: any, rangeToUse: any, piecewiseFunction: any): void;
declare function computeOpacities(gaussians: any, sampling?: number): number[];
declare function createListener(callback: any, preventDefault?: boolean): (e: any) => void;
export interface T110 {
  lineWidth: number;
  strokeStyle: string;
}
declare function drawChart(ctx: any, area: any, values: any, style?: T110): void;
declare function findGaussian(x: any, gaussians: any): any;
declare function listenerSelector(condition: any, ok: any, ko: any): (e: any) => any;
declare function normalizeCoordinates(x: any, y: any, subRectangeArea: any, zoomRange?: number[]): number[];
declare function extend_9(publicAPI: any, model: any, initialValues?: T100): void;
export interface T111 {
  applyGaussianToPiecewiseFunction: typeof applyGaussianToPiecewiseFunction;
  computeOpacities: typeof computeOpacities;
  createListener: typeof createListener;
  drawChart: typeof drawChart;
  findGaussian: typeof findGaussian;
  listenerSelector: typeof listenerSelector;
  normalizeCoordinates: typeof normalizeCoordinates;
  newInstance: any;
  extend: typeof extend_9;
}
declare function extend_10(publicAPI: any, model: any, initialValues?: T100): void;
export interface T112 {
  newInstance: any;
  extend: typeof extend_10;
}
declare function extend_11(publicAPI: any, model: any, initialValues?: T100): void;
export interface T113 {
  newInstance: any;
  extend: typeof extend_11;
}
declare function extend_12(publicAPI: any, model: any, initialValues?: T100): void;
export interface T114 {
  newInstance: any;
  extend: typeof extend_12;
}
declare function extend_13(publicAPI: any, model: any, initialValues?: T100): void;
export interface T115 {
  newInstance: any;
  extend: typeof extend_13;
}
declare function extend_14(publicAPI: any, model: any, initialValues?: T100): void;
export interface T116 {
  newInstance: any;
  extend: typeof extend_14;
}
declare function extend_15(publicAPI: any, model: any, initialValues?: T100): void;
export interface T117 {
  newInstance: any;
  extend: typeof extend_15;
}
export interface T118 {
  vtkAbstractWidget: T101;
  vtkDistanceRepresentation: T102;
  vtkDistanceWidget: T103;
  vtkHandleRepresentation: any;
  vtkHandleWidget: any;
  vtkImageCroppingRegionsRepresentation: T104;
  vtkImageCroppingRegionsWidget: T105;
  vtkLabelRepresentation: T106;
  vtkLabelWidget: T107;
  vtkLineRepresentation: T108;
  vtkLineWidget: T109;
  vtkOrientationMarkerWidget: any;
  vtkPiecewiseGaussianWidget: T111;
  vtkPointPlacer: T112;
  vtkResliceCursor: T113;
  vtkResliceCursorLineRepresentation: T114;
  vtkResliceCursorWidget: T115;
  vtkSphereHandleRepresentation: T116;
  vtkWidgetRepresentation: T117;
}
declare const T119: T118;
export default T119;
