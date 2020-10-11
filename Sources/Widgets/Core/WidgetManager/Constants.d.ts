export interface T100 {
  DEFAULT: number;
  GEOMETRY: number;
  SLICE: number;
  VOLUME: number;
  AXIAL: number;
  CORONAL: number;
  SAGITTAL: number;
}
export const ViewTypes: T100;
export interface T101 {
  PICKING_BUFFER: number;
  FRONT_BUFFER: number;
}
export const RenderingTypes: T101;
export interface T102 {
  MOUSE_MOVE: number;
  MOUSE_RELEASE: number;
}
export const CaptureOn: T102;
export interface T103 {
  ViewTypes: T100;
  RenderingTypes: T101;
  CaptureOn: T102;
}
declare const T104: T103;
export default T104;
