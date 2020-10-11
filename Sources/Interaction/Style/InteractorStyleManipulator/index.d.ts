declare function dollyToPosition(fact: any, position: any, renderer: any, rwi: any): void;
declare function translateCamera(renderer: any, rwi: any, toX: any, toY: any, fromX: any, fromY: any): void;
declare function dollyByFactor(interactor: any, renderer: any, factor: any): void;
export interface T100 {
  dollyToPosition: typeof dollyToPosition;
  translateCamera: typeof translateCamera;
  dollyByFactor: typeof dollyByFactor;
}
export const STATIC: T100;
export interface T101 {
  [key: string]: any;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T101): void;
export const extend: typeof extend_1;
export const newInstance: any;
export interface T102 {
  dollyToPosition: typeof dollyToPosition;
  translateCamera: typeof translateCamera;
  dollyByFactor: typeof dollyByFactor;
  newInstance: any;
  extend: typeof extend_1;
}
declare const T103: T102;
export default T103;
