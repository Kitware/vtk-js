export interface T100 {
  [key: string]: any;
}
declare function extend(publicAPI: any, model: any, initialValues?: T100): void;
export interface T101 {
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
  newInstance: any;
  extend: typeof extend_4;
}
declare function extend_5(publicAPI: any, model: any, initialValues?: T100): void;
export interface T106 {
  newInstance: any;
  extend: typeof extend_5;
  Presets: any;
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
export interface T109 {
  planeId: number;
  t1: number;
  t2: number;
  intersect: number;
}
declare function clipLineWithPlane(mapper: any, matrix: any, p1: any, p2: any): number | T109;
declare function extend_8(publicAPI: any, model: any, initialValues?: T100): void;
export interface T110 {
  clipLineWithPlane: typeof clipLineWithPlane;
  newInstance: any;
  extend: typeof extend_8;
}
declare function extend_9(publicAPI: any, model: any, initialValues?: T100): void;
export interface T111 {
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
declare function computeWorldToDisplay(renderer: any, x: any, y: any, z: any): any;
declare function computeDisplayToWorld(renderer: any, x: any, y: any, z: any): any;
declare function extend_12(publicAPI: any, model: any, initialValues?: T100): void;
export interface T114 {
  computeWorldToDisplay: typeof computeWorldToDisplay;
  computeDisplayToWorld: typeof computeDisplayToWorld;
  newInstance: any;
  extend: typeof extend_12;
}
declare function extend_13(publicAPI: any, model: any, initialValues?: T100): void;
export interface T115 {
  newInstance: any;
  extend: typeof extend_13;
  LIGHT_TYPES: string[];
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
declare function extend_16(publicAPI: any, model: any, initialValues?: T100): void;
export interface T118 {
  newInstance: any;
  extend: typeof extend_16;
}
declare function extend_17(publicAPI: any, model: any, initialValues?: T100): void;
export interface T119 {
  newInstance: any;
  extend: typeof extend_17;
}
declare function extend_18(publicAPI: any, model: any, initialValues?: T100): void;
export interface T120 {
  newInstance: any;
  extend: typeof extend_18;
}
declare function extend_19(publicAPI: any, model: any, initialValues?: T100): void;
export interface T121 {
  newInstance: any;
  extend: typeof extend_19;
}
declare function extend_20(publicAPI: any, model: any, initialValues?: T100): void;
export interface T122 {
  newInstance: any;
  extend: typeof extend_20;
}
declare function extend_21(publicAPI: any, model: any, initialValues?: T100): void;
export interface T123 {
  newInstance: any;
  extend: typeof extend_21;
}
declare function extend_22(publicAPI: any, model: any, initialValues?: T100): void;
export interface T124 {
  newInstance: any;
  extend: typeof extend_22;
}
declare function extend_23(publicAPI: any, model: any, initialValues?: T100): void;
export interface T125 {
  newInstance: any;
  extend: typeof extend_23;
}
declare function extend_24(publicAPI: any, model: any, initialValues?: T100): void;
export interface T126 {
  newInstance: any;
  extend: typeof extend_24;
}
declare function extend_25(publicAPI: any, model: any, initialValues?: T100): void;
export interface T127 {
  newInstance: any;
  extend: typeof extend_25;
}
declare function extend_26(publicAPI: any, model: any, initialValues?: T100): void;
export interface T128 {
  newInstance: any;
  extend: typeof extend_26;
}
declare function extend_27(publicAPI: any, model: any, initialValues?: T100): void;
export interface T129 {
  newInstance: any;
  extend: typeof extend_27;
}
declare function extend_28(publicAPI: any, model: any, initialValues?: T100): void;
export interface T130 {
  newInstance: any;
  extend: typeof extend_28;
}
export interface T131 {
  vtkAbstractMapper: T101;
  vtkAbstractMapper3D: T102;
  vtkAbstractPicker: T103;
  vtkActor: T104;
  vtkActor2D: T105;
  vtkAnnotatedCubeActor: T106;
  vtkAxesActor: T107;
  vtkCamera: T108;
  vtkCellPicker: T110;
  vtkColorTransferFunction: any;
  vtkCoordinate: any;
  vtkFollower: T111;
  vtkGlyph3DMapper: any;
  vtkImageMapper: any;
  vtkImageProperty: T112;
  vtkImageSlice: T113;
  vtkInteractorObserver: T114;
  vtkInteractorStyle: any;
  vtkLight: T115;
  vtkMapper: any;
  vtkPicker: T116;
  vtkPixelSpaceCallbackMapper: T117;
  vtkPointPicker: T118;
  vtkProp: T119;
  vtkProp3D: T120;
  vtkProperty: any;
  vtkProperty2D: T121;
  vtkRenderer: T122;
  vtkRenderWindow: T123;
  vtkRenderWindowInteractor: any;
  vtkSkybox: T124;
  vtkSphereMapper: T125;
  vtkStickMapper: T126;
  vtkTexture: T127;
  vtkViewport: T128;
  vtkVolume: T129;
  vtkVolumeMapper: T130;
  vtkVolumeProperty: any;
}
declare const T132: T131;
export default T132;
