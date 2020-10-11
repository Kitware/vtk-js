export interface T100 {
  text: string;
  faceColor: string;
  faceRotation: number;
  fontFamily: string;
  fontColor: string;
  fontStyle: string;
  fontSizeScale: (resolution: any) => number;
  edgeThickness: number;
  edgeColor: string;
  resolution: number;
}
export interface T101 {
  defaultStyle: T100;
}
export const DEFAULT_VALUES: T101;
export interface T102 {
  [key: string]: any;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T102): void;
export const extend: typeof extend_1;
export const newInstance: any;
export interface T103 {
  newInstance: any;
  extend: typeof extend_1;
  Presets: any;
}
declare const T104: T103;
export default T104;
