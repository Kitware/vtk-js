export interface T100 {
  pointer: any;
  extent: number[];
  increments: number[];
  scalarType: any;
  dataTypeSize: number;
  numberOfComponents: number;
  borderMode: number;
  interpolationMode: number;
  extraInfo: any;
}
export const vtkInterpolationInfo: T100;
export interface T101 {
  positions: number[];
  weights: any;
  weightExtent: number[];
  kernelSize: number[];
  workspace: any;
  lastY: any;
  lastZ: any;
  pointer: any;
  extent: number[];
  increments: number[];
  scalarType: any;
  dataTypeSize: number;
  numberOfComponents: number;
  borderMode: number;
  interpolationMode: number;
  extraInfo: any;
}
export const vtkInterpolationWeights: T101;
export interface T102 {
  floored: number;
  error: number;
}
declare function vtkInterpolationMathFloor_1(x: any): T102;
export const vtkInterpolationMathFloor: typeof vtkInterpolationMathFloor_1;
declare function vtkInterpolationMathRound_1(x: any): number;
export const vtkInterpolationMathRound: typeof vtkInterpolationMathRound_1;
declare function vtkInterpolationMathClamp_1(a: any, b: any, c: any): any;
export const vtkInterpolationMathClamp: typeof vtkInterpolationMathClamp_1;
declare function vtkInterpolationMathWrap_1(a: any, b: any, c: any): number;
export const vtkInterpolationMathWrap: typeof vtkInterpolationMathWrap_1;
declare function vtkInterpolationMathMirror_1(a: any, b: any, c: any): number;
export const vtkInterpolationMathMirror: typeof vtkInterpolationMathMirror_1;
export interface T103 {
  vtkInterpolationInfo: T100;
  vtkInterpolationWeights: T101;
  vtkInterpolationMathFloor: typeof vtkInterpolationMathFloor_1;
  vtkInterpolationMathRound: typeof vtkInterpolationMathRound_1;
  vtkInterpolationMathClamp: typeof vtkInterpolationMathClamp_1;
  vtkInterpolationMathWrap: typeof vtkInterpolationMathWrap_1;
  vtkInterpolationMathMirror: typeof vtkInterpolationMathMirror_1;
}
declare const T104: T103;
export default T104;
