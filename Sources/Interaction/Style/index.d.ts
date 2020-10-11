export interface T100 {
  [key: string]: any;
}
declare function extend(publicAPI: any, model: any, initialValues?: T100): void;
export interface T101 {
  newInstance: any;
  extend: typeof extend;
}
declare function dollyToPosition(fact: any, position: any, renderer: any, rwi: any): void;
declare function translateCamera(renderer: any, rwi: any, toX: any, toY: any, fromX: any, fromY: any): void;
declare function dollyByFactor(interactor: any, renderer: any, factor: any): void;
declare function extend_1(publicAPI: any, model: any, initialValues?: T100): void;
export interface T102 {
  dollyToPosition: typeof dollyToPosition;
  translateCamera: typeof translateCamera;
  dollyByFactor: typeof dollyByFactor;
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
export interface T106 {
  vtkInteractorStyleImage: T101;
  vtkInteractorStyleManipulator: T102;
  vtkInteractorStyleMPRSlice: T103;
  vtkInteractorStyleRemoteMouse: T104;
  vtkInteractorStyleTrackballCamera: T105;
}
declare const T107: T106;
export default T107;
