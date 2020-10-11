declare function evaluate(normal: any, origin: any, x: any): number;
declare function distanceToPlane(x: any, origin: any, normal: any): number;
declare function projectPoint(x: any, origin: any, normal: any, xproj: any): void;
declare function projectVector(v: any, normal: any, vproj: any): void;
declare function generalizedProjectPoint(x: any, origin: any, normal: any, xproj: any): void;
export interface T100 {
  intersection: boolean;
  betweenPoints: boolean;
  t: number;
  x: any[];
}
declare function intersectWithLine(p1: any, p2: any, origin: any, normal: any): T100;
export interface T101 {
  intersection: boolean;
  l0: any[];
  l1: any[];
  error: any;
}
declare function intersectWithPlane(plane1Origin: any, plane1Normal: any, plane2Origin: any, plane2Normal: any): T101;
export interface T102 {
  evaluate: typeof evaluate;
  distanceToPlane: typeof distanceToPlane;
  projectPoint: typeof projectPoint;
  projectVector: typeof projectVector;
  generalizedProjectPoint: typeof generalizedProjectPoint;
  intersectWithLine: typeof intersectWithLine;
  intersectWithPlane: typeof intersectWithPlane;
  DISJOINT: string;
  COINCIDE: string;
}
export const STATIC: T102;
declare function vtkPlane_1(publicAPI: any, model: any): void;
export const vtkPlane: typeof vtkPlane_1;
export interface T103 {
  [key: string]: any;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T103): void;
export const extend: typeof extend_1;
export const newInstance: any;
export interface T104 {
  evaluate: typeof evaluate;
  distanceToPlane: typeof distanceToPlane;
  projectPoint: typeof projectPoint;
  projectVector: typeof projectVector;
  generalizedProjectPoint: typeof generalizedProjectPoint;
  intersectWithLine: typeof intersectWithLine;
  intersectWithPlane: typeof intersectWithPlane;
  DISJOINT: string;
  COINCIDE: string;
  newInstance: any;
  extend: typeof extend_1;
}
declare const T105: T104;
export default T105;
