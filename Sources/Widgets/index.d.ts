/**
 * @param {*} publicAPI public methods to populate
 * @param {*} model internal values to populate
 * @param {object} initialValues Contains at least
 *   {viewType, renderer, camera, openGLRenderWindow, factory}
 */
declare function extend(publicAPI: any, model: any, initialValues?: any): void;
export interface T100 {
  newInstance: any;
  extend: typeof extend;
}
export interface T101 {
  [key: string]: any;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T101): void;
export interface T102 {
  newInstance: any;
  extend: typeof extend_1;
}
export interface T104 {
  labels: any;
  mixins: any;
  name: any;
  initialValues: any;
}
export interface T107 {
  labels: any;
  name: any;
  instance: any;
}
export interface T109 {
  name: any;
  initialValue: any;
}
declare class Builder {
  publicAPI: T101;
  model: T101;
  constructor();
  addDynamicMixinState(T103: T104): this;
  addStateFromMixin(T105: T104): this;
  addStateFromInstance(T106: T107): this;
  addField(T108: T109): this;
  build(...mixins: any[]): Readonly<T101>;
}
declare function createBuilder(): Builder;
export interface T110 {
  createBuilder: typeof createBuilder;
}
declare function extend_2(publicAPI: any, model: any, initialValues?: T101): void;
export interface T111 {
  newInstance: any;
  extend: typeof extend_2;
  Constants: any;
}
declare function extend_3(publicAPI: any, model: any, initialValues?: T101): void;
export interface T112 {
  extend: typeof extend_3;
}
export interface T113 {
  vtkAbstractWidget: T100;
  vtkAbstractWidgetFactory: T102;
  vtkStateBuilder: T110;
  vtkWidgetManager: T111;
  vtkWidgetState: T112;
}
declare function projectDisplayToLine(x: any, y: any, lineOrigin: any, lineDirection: any, renderer: any, glRenderWindow: any): any;
declare function extend_4(publicAPI: any, model: any, initialValues?: T101): void;
export interface T114 {
  projectDisplayToLine: typeof projectDisplayToLine;
  extend: typeof extend_4;
  newInstance: any;
}
declare function intersectDisplayWithPlane(x: any, y: any, planeOrigin: any, planeNormal: any, renderer: any, glRenderWindow: any): any;
declare function extend_5(publicAPI: any, model: any, initialValues?: T101): void;
export interface T115 {
  intersectDisplayWithPlane: typeof intersectDisplayWithPlane;
  extend: typeof extend_5;
  newInstance: any;
}
declare function trackballRotate(prevX: any, prevY: any, curX: any, curY: any, origin: any, direction: any, renderer: any, glRenderWindow: any): number[];
declare function extend_6(publicAPI: any, model: any, initialValues?: T101): void;
export interface T116 {
  trackballRotate: typeof trackballRotate;
  extend: typeof extend_6;
  newInstance: any;
}
export interface T117 {
  vtkLineManipulator: T114;
  vtkPlaneManipulator: T115;
  vtkTrackballManipulator: T116;
}
declare function extend_7(publicAPI: any, model: any, initialValues?: T101): void;
export interface T118 {
  newInstance: any;
  extend: typeof extend_7;
}
declare function extend_8(publicAPI: any, model: any, initialValues?: T101): void;
export interface T119 {
  extend: typeof extend_8;
}
declare function extend_9(publicAPI: any, model: any, initialValues?: T101): void;
export interface T120 {
  newInstance: any;
  extend: typeof extend_9;
}
declare function extend_10(publicAPI: any, model: any, initialValues?: T101): void;
export interface T121 {
  newInstance: any;
  extend: typeof extend_10;
}
declare function extend_11(publicAPI: any, model: any, initialValues?: T101): void;
export interface T122 {
  extend: typeof extend_11;
}
declare function extend_12(publicAPI: any, model: any, initialValues?: T101): void;
declare function generateState(): any;
export interface T123 {
  newInstance: any;
  extend: typeof extend_12;
  generateState: typeof generateState;
}
declare function extend_13(publicAPI: any, model: any, initialValues?: T101): void;
export interface T124 {
  newInstance: any;
  extend: typeof extend_13;
}
declare function extend_14(publicAPI: any, model: any, initialValues?: T101): void;
export interface T125 {
  newInstance: any;
  extend: typeof extend_14;
}
declare function extend_15(publicAPI: any, model: any, initialValues?: T101): void;
export interface T126 {
  newInstance: any;
  extend: typeof extend_15;
}
declare function extend_16(publicAPI: any, model: any, initialValues?: T101): void;
export interface T127 {
  active: T101;
  inactive: T101;
  static: T101;
}
declare function mergeStyles(elementNames: any, ...stylesToMerge: any[]): T127;
declare function applyStyles(pipelines: any, styles: any, activeActor: any): void;
declare function connectPipeline(pipeline: any): void;
export interface T128 {
  extend: typeof extend_16;
  mergeStyles: typeof mergeStyles;
  applyStyles: typeof applyStyles;
  connectPipeline: typeof connectPipeline;
}
export interface T129 {
  vtkCircleContextRepresentation: T118;
  vtkContextRepresentation: T119;
  vtkConvexFaceContextRepresentation: T120;
  vtkCubeHandleRepresentation: T121;
  vtkHandleRepresentation: T122;
  vtkImplicitPlaneRepresentation: T123;
  vtkOutlineContextRepresentation: T124;
  vtkPolyLineRepresentation: T125;
  vtkSphereHandleRepresentation: T126;
  vtkWidgetRepresentation: T128;
}
declare function extend_17(publicAPI: any, model: any, initialValues?: T101): void;
export interface T130 {
  newInstance: any;
  extend: typeof extend_17;
}
declare function extend_18(publicAPI: any, model: any, initialValues?: T101): void;
export interface T131 {
  newInstance: any;
  extend: typeof extend_18;
}
declare function extend_19(publicAPI: any, model: any, initialValues?: T101): void;
export interface T132 {
  newInstance: any;
  extend: typeof extend_19;
}
declare function extend_20(publicAPI: any, model: any, initialValues?: T101): void;
export interface T133 {
  newInstance: any;
  extend: typeof extend_20;
}
declare function extend_21(publicAPI: any, model: any, initialValues?: T101): void;
export interface T134 {
  newInstance: any;
  extend: typeof extend_21;
}
declare function extend_22(publicAPI: any, model: any, initialValues?: T101): void;
export interface T135 {
  newInstance: any;
  extend: typeof extend_22;
}
declare function extend_23(publicAPI: any, model: any, initialValues?: T101): void;
export interface T136 {
  newInstance: any;
  extend: typeof extend_23;
}
export interface T137 {
  vtkEllipseWidget: T130;
  vtkImageCroppingWidget: T131;
  vtkImplicitPlaneWidget: T132;
  vtkInteractiveOrientationWidget: T133;
  vtkPaintWidget: T134;
  vtkPolyLineWidget: T135;
  vtkRectangleWidget: T136;
}
export interface T138 {
  Core: T113;
  Manipulators: T117;
  Representations: T129;
  Widgets3D: T137;
}
declare const T139: T138;
export default T139;
