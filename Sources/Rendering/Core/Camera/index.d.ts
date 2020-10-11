export interface T100 {
  position: number[];
  focalPoint: number[];
  viewUp: number[];
  directionOfProjection: number[];
  parallelProjection: boolean;
  useHorizontalViewAngle: boolean;
  viewAngle: number;
  parallelScale: number;
  clippingRange: number[];
  windowCenter: number[];
  viewPlaneNormal: number[];
  useOffAxisProjection: boolean;
  screenBottomLeft: number[];
  screenBottomRight: number[];
  screenTopRight: number[];
  freezeFocalPoint: boolean;
  projectionMatrix: any;
  viewMatrix: any;
  physicalTranslation: number[];
  physicalScale: number;
  physicalViewUp: number[];
  physicalViewNorth: number[];
}
export const DEFAULT_VALUES: T100;
export interface T101 {
  [key: string]: any;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T101): void;
export const extend: typeof extend_1;
export const newInstance: any;
export interface T102 {
  newInstance: any;
  extend: typeof extend_1;
}
declare const T103: T102;
export default T103;
