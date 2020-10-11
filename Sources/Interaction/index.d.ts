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
  extend: typeof extend_2;
}
declare function extend_3(publicAPI: any, model: any, initialValues?: T100): void;
export interface T104 {
  extend: typeof extend_3;
}
declare function extend_4(publicAPI: any, model: any, initialValues?: T100): void;
export interface T105 {
  extend: typeof extend_4;
  Device: any;
  Input: any;
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
declare function extend_9(publicAPI: any, model: any, initialValues?: T100): void;
export interface T110 {
  newInstance: any;
  extend: typeof extend_9;
}
declare function extend_10(publicAPI: any, model: any, initialValues?: T100): void;
export interface T111 {
  newInstance: any;
  extend: typeof extend_10;
}
declare function extend_11(publicAPI: any, model: any, initialValues?: T100): void;
export interface T112 {
  newInstance: any;
  extend: typeof extend_11;
}
declare function extend_12(publicAPI: any, model: any, initialValues?: T100): void;
export interface T113 {
  newInstance: any;
  extend: typeof extend_12;
}
declare function extend_13(publicAPI: any, model: any, initialValues?: T100): void;
export interface T114 {
  newInstance: any;
  extend: typeof extend_13;
}
declare function extend_14(publicAPI: any, model: any, initialValues?: T100): void;
export interface T115 {
  newInstance: any;
  extend: typeof extend_14;
}
declare function extend_15(publicAPI: any, model: any, initialValues?: T100): void;
export interface T116 {
  newInstance: any;
  extend: typeof extend_15;
}
declare function extend_16(publicAPI: any, model: any, initialValues?: T100): void;
export interface T117 {
  newInstance: any;
  extend: typeof extend_16;
}
declare function extend_17(publicAPI: any, model: any, initialValues?: T100): void;
export interface T118 {
  newInstance: any;
  extend: typeof extend_17;
}
export interface T119 {
  vtkCompositeCameraManipulator: T101;
  vtkCompositeGestureManipulator: T102;
  vtkCompositeKeyboardManipulator: T103;
  vtkCompositeMouseManipulator: T104;
  vtkCompositeVRManipulator: T105;
  vtkGestureCameraManipulator: T106;
  vtkKeyboardCameraManipulator: T107;
  vtkMouseCameraAxisRotateManipulator: T108;
  vtkMouseCameraSliceManipulator: T109;
  vtkMouseCameraTrackballFirstPersonManipulator: T110;
  vtkMouseCameraTrackballMultiRotateManipulator: T111;
  vtkMouseCameraTrackballPanManipulator: T112;
  vtkMouseCameraTrackballRollManipulator: T113;
  vtkMouseCameraTrackballRotateManipulator: T114;
  vtkMouseCameraTrackballZoomManipulator: T115;
  vtkMouseCameraTrackballZoomToMouseManipulator: T116;
  vtkMouseRangeManipulator: T117;
  vtkVRButtonPanManipulator: T118;
}
declare function addCameraToSynchronize(renderWindowInteractor: any, camera: any, onCameraUpdate: any): number;
declare function addWindowListeners(): void;
declare function isDeviceOrientationSupported(): boolean;
declare function removeCameraToSynchronize(id: any, cancelAnimation?: boolean): void;
declare function removeWindowListeners(): void;
export interface T120 {
  addCameraToSynchronize: typeof addCameraToSynchronize;
  addWindowListeners: typeof addWindowListeners;
  isDeviceOrientationSupported: typeof isDeviceOrientationSupported;
  removeCameraToSynchronize: typeof removeCameraToSynchronize;
  removeWindowListeners: typeof removeWindowListeners;
}
export interface T121 {
  vtkDeviceOrientationToCamera: T120;
}
declare function extend_18(publicAPI: any, model: any, initialValues?: T100): void;
export interface T122 {
  newInstance: any;
  extend: typeof extend_18;
}
declare function dollyToPosition(fact: any, position: any, renderer: any, rwi: any): void;
declare function translateCamera(renderer: any, rwi: any, toX: any, toY: any, fromX: any, fromY: any): void;
declare function dollyByFactor(interactor: any, renderer: any, factor: any): void;
declare function extend_19(publicAPI: any, model: any, initialValues?: T100): void;
export interface T123 {
  dollyToPosition: typeof dollyToPosition;
  translateCamera: typeof translateCamera;
  dollyByFactor: typeof dollyByFactor;
  newInstance: any;
  extend: typeof extend_19;
}
declare function extend_20(publicAPI: any, model: any, initialValues?: T100): void;
export interface T124 {
  newInstance: any;
  extend: typeof extend_20;
}
declare function extend_21(publicAPI: any, model: any, initialValues?: T100): void;
export interface T125 {
  newInstance: any;
  extend: typeof extend_21;
}
declare function extend_22(publicAPI: any, model: any, initialValues?: T100): void;
export interface T126 {
  newInstance: any;
  extend: typeof extend_22;
}
export interface T127 {
  vtkInteractorStyleImage: T122;
  vtkInteractorStyleManipulator: T123;
  vtkInteractorStyleMPRSlice: T124;
  vtkInteractorStyleRemoteMouse: T125;
  vtkInteractorStyleTrackballCamera: T126;
}
declare function extend_23(publicAPI: any, model: any, initialValues?: T100): void;
declare function applyTemplate(template: any, map: any, fallback: any): any;
export interface T128 {
  newInstance: any;
  extend: typeof extend_23;
  applyTemplate: typeof applyTemplate;
}
declare function extend_24(publicAPI: any, model: any, initialValues?: T100): void;
export interface T129 {
  newInstance: any;
  extend: typeof extend_24;
}
export interface T130 {
  Contrast: any;
  Logo: any;
  Spacing: any;
  Tint: any;
}
declare function extend_25(publicAPI: any, model: any, initialValues?: T100): void;
export interface T131 {
  newInstance: any;
  extend: typeof extend_25;
}
export interface T132 {
  vtkCornerAnnotation: T128;
  vtkFPSMonitor: T129;
  vtkIcons: T130;
  vtkSlider: any;
  vtkVolumeController: T131;
}
declare function extend_26(publicAPI: any, model: any, initialValues?: T100): void;
export interface T133 {
  newInstance: any;
  extend: typeof extend_26;
}
declare function extend_27(publicAPI: any, model: any, initialValues?: T100): void;
export interface T134 {
  newInstance: any;
  extend: typeof extend_27;
}
declare function extend_28(publicAPI: any, model: any, initialValues?: T100): void;
export interface T135 {
  newInstance: any;
  extend: typeof extend_28;
}
declare function extend_29(publicAPI: any, model: any, initialValues?: T100): void;
export interface T136 {
  newInstance: any;
  extend: typeof extend_29;
}
declare function extend_30(publicAPI: any, model: any, initialValues?: T100): void;
export interface T137 {
  newInstance: any;
  extend: typeof extend_30;
}
declare function extend_31(publicAPI: any, model: any, initialValues?: T100): void;
export interface T138 {
  newInstance: any;
  extend: typeof extend_31;
}
declare function extend_32(publicAPI: any, model: any, initialValues?: T100): void;
export interface T139 {
  newInstance: any;
  extend: typeof extend_32;
}
declare function extend_33(publicAPI: any, model: any, initialValues?: T100): void;
export interface T140 {
  newInstance: any;
  extend: typeof extend_33;
}
declare function extend_34(publicAPI: any, model: any, initialValues?: T100): void;
export interface T141 {
  newInstance: any;
  extend: typeof extend_34;
}
declare function applyGaussianToPiecewiseFunction(gaussians: any, sampling: any, rangeToUse: any, piecewiseFunction: any): void;
declare function computeOpacities(gaussians: any, sampling?: number): number[];
declare function createListener(callback: any, preventDefault?: boolean): (e: any) => void;
export interface T142 {
  lineWidth: number;
  strokeStyle: string;
}
declare function drawChart(ctx: any, area: any, values: any, style?: T142): void;
declare function findGaussian(x: any, gaussians: any): any;
declare function listenerSelector(condition: any, ok: any, ko: any): (e: any) => any;
declare function normalizeCoordinates(x: any, y: any, subRectangeArea: any, zoomRange?: number[]): number[];
declare function extend_35(publicAPI: any, model: any, initialValues?: T100): void;
export interface T143 {
  applyGaussianToPiecewiseFunction: typeof applyGaussianToPiecewiseFunction;
  computeOpacities: typeof computeOpacities;
  createListener: typeof createListener;
  drawChart: typeof drawChart;
  findGaussian: typeof findGaussian;
  listenerSelector: typeof listenerSelector;
  normalizeCoordinates: typeof normalizeCoordinates;
  newInstance: any;
  extend: typeof extend_35;
}
declare function extend_36(publicAPI: any, model: any, initialValues?: T100): void;
export interface T144 {
  newInstance: any;
  extend: typeof extend_36;
}
declare function extend_37(publicAPI: any, model: any, initialValues?: T100): void;
export interface T145 {
  newInstance: any;
  extend: typeof extend_37;
}
declare function extend_38(publicAPI: any, model: any, initialValues?: T100): void;
export interface T146 {
  newInstance: any;
  extend: typeof extend_38;
}
declare function extend_39(publicAPI: any, model: any, initialValues?: T100): void;
export interface T147 {
  newInstance: any;
  extend: typeof extend_39;
}
declare function extend_40(publicAPI: any, model: any, initialValues?: T100): void;
export interface T148 {
  newInstance: any;
  extend: typeof extend_40;
}
declare function extend_41(publicAPI: any, model: any, initialValues?: T100): void;
export interface T149 {
  newInstance: any;
  extend: typeof extend_41;
}
export interface T150 {
  vtkAbstractWidget: T133;
  vtkDistanceRepresentation: T134;
  vtkDistanceWidget: T135;
  vtkHandleRepresentation: any;
  vtkHandleWidget: any;
  vtkImageCroppingRegionsRepresentation: T136;
  vtkImageCroppingRegionsWidget: T137;
  vtkLabelRepresentation: T138;
  vtkLabelWidget: T139;
  vtkLineRepresentation: T140;
  vtkLineWidget: T141;
  vtkOrientationMarkerWidget: any;
  vtkPiecewiseGaussianWidget: T143;
  vtkPointPlacer: T144;
  vtkResliceCursor: T145;
  vtkResliceCursorLineRepresentation: T146;
  vtkResliceCursorWidget: T147;
  vtkSphereHandleRepresentation: T148;
  vtkWidgetRepresentation: T149;
}
export interface T151 {
  Manipulators: T119;
  Misc: T121;
  Style: T127;
  UI: T132;
  Widgets: T150;
}
declare const T152: T151;
export default T152;
