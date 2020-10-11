declare function isValid(bounds: any): boolean;
declare function getCenter(bounds: any): number[];
declare function getLength(bounds: any, index: any): number;
declare function getLengths(bounds: any): number[];
declare function getMaxLength(bounds: any): number;
declare function getDiagonalLength(bounds: any): number;
declare function getXRange(bounds: any): any;
declare function getYRange(bounds: any): any;
declare function getZRange(bounds: any): any;
declare function getCorners(bounds: any, corners: any): void;
declare function computeCornerPoints(point1: any, point2: any, bounds: any): void;
declare function computeScale3(bounds: any, scale3?: any[]): any[];
export interface T100 {
  isValid: typeof isValid;
  getCenter: typeof getCenter;
  getLength: typeof getLength;
  getLengths: typeof getLengths;
  getMaxLength: typeof getMaxLength;
  getDiagonalLength: typeof getDiagonalLength;
  getXRange: typeof getXRange;
  getYRange: typeof getYRange;
  getZRange: typeof getZRange;
  getCorners: typeof getCorners;
  computeCornerPoints: typeof computeCornerPoints;
  computeScale3: typeof computeScale3;
  INIT_BOUNDS: number[];
}
export const STATIC: T100;
export interface T101 {
  [key: string]: any;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T101): void;
export const extend: typeof extend_1;
export const newInstance: any;
export interface T102 {
  isValid: typeof isValid;
  getCenter: typeof getCenter;
  getLength: typeof getLength;
  getLengths: typeof getLengths;
  getMaxLength: typeof getMaxLength;
  getDiagonalLength: typeof getDiagonalLength;
  getXRange: typeof getXRange;
  getYRange: typeof getYRange;
  getZRange: typeof getZRange;
  getCorners: typeof getCorners;
  computeCornerPoints: typeof computeCornerPoints;
  computeScale3: typeof computeScale3;
  INIT_BOUNDS: number[];
  newInstance: any;
  extend: typeof extend_1;
}
declare const T103: T102;
export default T103;
