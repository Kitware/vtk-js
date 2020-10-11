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
  [key: string]: any;
}
declare function extend(publicAPI: any, model: any, initialValues?: T100): void;
export interface T101 {
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
  extend: typeof extend;
}
declare function intersectBox(bounds: any, origin: any, dir: any, coord: any, tolerance: any): number | number;
declare function intersectPlane(bounds: any, origin: any, normal: any): number | number;
declare function extend_1(publicAPI: any, model: any, initialValues?: T100): void;
export interface T102 {
  intersectBox: typeof intersectBox;
  intersectPlane: typeof intersectPlane;
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
declare function evaluate(radius: any, center: any, axis: any, x: any): number;
declare function extend_4(publicAPI: any, model: any, initialValues?: T100): void;
export interface T105 {
  evaluate: typeof evaluate;
  newInstance: any;
  extend: typeof extend_4;
}
/**
 * Converts an itk.js image to a vtk.js image.
 *
 * Requires an itk.js image as input.
 */
declare function convertItkToVtkImage(itkImage: any, options?: T100): any;
export interface T106 {
  dimension: number;
  pixelType: number;
  componentType: string;
  components: number;
}
export interface T107 {
  data: number[];
}
export interface T108 {
  imageType: T106;
  name: string;
  origin: any;
  spacing: any;
  direction: T107;
  size: any;
}
/**
 * Converts a vtk.js image to an itk.js image.
 *
 * Requires a vtk.js image as input.
 */
declare function convertVtkToItkImage(vtkImage: any, copyData?: boolean): T108;
export interface T109 {
  convertItkToVtkImage: typeof convertItkToVtkImage;
  convertVtkToItkImage: typeof convertVtkToItkImage;
}
declare function extend_5(publicAPI: any, model: any, initialValues?: T100): void;
export interface T110 {
  newInstance: any;
  extend: typeof extend_5;
}
declare function extend_6(publicAPI: any, model: any, initialValues?: T100): void;
export interface T111 {
  newInstance: any;
  extend: typeof extend_6;
}
declare function extend_7(publicAPI: any, model: any, initialValues?: T100): void;
export interface T112 {
  newInstance: any;
  extend: typeof extend_7;
}
declare function evaluate_1(normal: any, origin: any, x: any): number;
declare function distanceToPlane(x: any, origin: any, normal: any): number;
declare function projectPoint(x: any, origin: any, normal: any, xproj: any): void;
declare function projectVector(v: any, normal: any, vproj: any): void;
declare function generalizedProjectPoint(x: any, origin: any, normal: any, xproj: any): void;
export interface T113 {
  intersection: boolean;
  betweenPoints: boolean;
  t: number;
  x: any[];
}
declare function intersectWithLine(p1: any, p2: any, origin: any, normal: any): T113;
export interface T114 {
  intersection: boolean;
  l0: any[];
  l1: any[];
  error: any;
}
declare function intersectWithPlane(plane1Origin: any, plane1Normal: any, plane2Origin: any, plane2Normal: any): T114;
declare function extend_8(publicAPI: any, model: any, initialValues?: T100): void;
export interface T115 {
  evaluate: typeof evaluate_1;
  distanceToPlane: typeof distanceToPlane;
  projectPoint: typeof projectPoint;
  projectVector: typeof projectVector;
  generalizedProjectPoint: typeof generalizedProjectPoint;
  intersectWithLine: typeof intersectWithLine;
  intersectWithPlane: typeof intersectWithPlane;
  DISJOINT: string;
  COINCIDE: string;
  newInstance: any;
  extend: typeof extend_8;
}
declare function extend_9(publicAPI: any, model: any, initialValues?: T100): void;
export interface T116 {
  newInstance: any;
  extend: typeof extend_9;
}
declare function extend_10(publicAPI: any, model: any, initialValues?: T100): void;
export interface T117 {
  newInstance: any;
  extend: typeof extend_10;
}
declare function evaluate_2(radius: any, center: any, x: any): number;
declare function isPointIn3DEllipse(point: any, bounds: any): boolean;
declare function extend_11(publicAPI: any, model: any, initialValues?: T100): void;
export interface T118 {
  evaluate: typeof evaluate_2;
  isPointIn3DEllipse: typeof isPointIn3DEllipse;
  newInstance: any;
  extend: typeof extend_11;
}
declare function computeNormalDirection(v1: any, v2: any, v3: any, n: any): void;
declare function computeNormal(v1: any, v2: any, v3: any, n: any): void;
declare function extend_12(publicAPI: any, model: any, initialValues?: T100): void;
export interface T119 {
  computeNormalDirection: typeof computeNormalDirection;
  computeNormal: typeof computeNormal;
  newInstance: any;
  extend: typeof extend_12;
}
export interface T120 {
  vtkBoundingBox: T101;
  vtkBox: T102;
  vtkCell: T103;
  vtkCone: T104;
  vtkCylinder: T105;
  vtkDataSet: any;
  vtkDataSetAttributes: any;
  vtkITKHelper: T109;
  vtkImageData: T110;
  vtkImplicitBoolean: any;
  vtkLine: any;
  vtkMolecule: T111;
  vtkPiecewiseFunction: T112;
  vtkPlane: T115;
  vtkPointSet: T116;
  vtkPolyData: T117;
  vtkSelectionNode: any;
  vtkSphere: T118;
  vtkStructuredData: any;
  vtkTriangle: T119;
}
declare const T121: T120;
export default T121;
