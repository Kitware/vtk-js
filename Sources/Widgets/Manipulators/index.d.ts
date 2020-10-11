declare function projectDisplayToLine(x: any, y: any, lineOrigin: any, lineDirection: any, renderer: any, glRenderWindow: any): any;
export interface T100 {
  [key: string]: any;
}
declare function extend(publicAPI: any, model: any, initialValues?: T100): void;
export interface T101 {
  projectDisplayToLine: typeof projectDisplayToLine;
  extend: typeof extend;
  newInstance: any;
}
declare function intersectDisplayWithPlane(x: any, y: any, planeOrigin: any, planeNormal: any, renderer: any, glRenderWindow: any): any;
declare function extend_1(publicAPI: any, model: any, initialValues?: T100): void;
export interface T102 {
  intersectDisplayWithPlane: typeof intersectDisplayWithPlane;
  extend: typeof extend_1;
  newInstance: any;
}
declare function trackballRotate(prevX: any, prevY: any, curX: any, curY: any, origin: any, direction: any, renderer: any, glRenderWindow: any): number[];
declare function extend_2(publicAPI: any, model: any, initialValues?: T100): void;
export interface T103 {
  trackballRotate: typeof trackballRotate;
  extend: typeof extend_2;
  newInstance: any;
}
export interface T104 {
  vtkLineManipulator: T101;
  vtkPlaneManipulator: T102;
  vtkTrackballManipulator: T103;
}
declare const T105: T104;
export default T105;
