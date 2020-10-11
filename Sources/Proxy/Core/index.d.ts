export interface T100 {
  [key: string]: any;
}
declare function extend(publicAPI: any, model: any, initialValues?: T100): void;
export interface T101 {
  extend: typeof extend;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T100): void;
export interface T102 {
  Preset: number;
  RGBPoints: number;
  HSVPoints: number;
  Nodes: number;
}
export interface T103 {
  x: number;
  r: number;
  g: number;
  b: number;
  midpoint: number;
  sharpness: number;
}
export interface T104 {
  Preset: string;
  RGBPoints: Array<number[]>;
  HSVPoints: Array<number[]>;
  Nodes: T103[];
}
export interface T105 {
  newInstance: any;
  extend: typeof extend_1;
  Mode: T102;
  Defaults: T104;
}
declare function extend_2(publicAPI: any, model: any, initialValues?: T100): void;
export interface T106 {
  Gaussians: number;
  Points: number;
  Nodes: number;
}
export interface T107 {
  position: number;
  height: number;
  width: number;
  xBias: number;
  yBias: number;
}
export interface T108 {
  x: number;
  y: number;
  midpoint: number;
  sharpness: number;
}
export interface T109 {
  Gaussians: T107[];
  Points: Array<number[]>;
  Nodes: T108[];
}
export interface T110 {
  newInstance: any;
  extend: typeof extend_2;
  Mode: T106;
  Defaults: T109;
}
declare function extend_3(publicAPI: any, model: any, initialValues?: T100): void;
export interface T111 {
  newInstance: any;
  extend: typeof extend_3;
}
declare function extend_4(publicAPI: any, model: any, initialValues?: T100): void;
export interface T112 {
  newInstance: any;
  extend: typeof extend_4;
}
declare function extend_5(publicAPI: any, model: any, initialValues?: T100): void;
export interface T113 {
  newInstance: any;
  extend: typeof extend_5;
}
declare function extend_6(publicAPI: any, model: any, initialValues?: T100): void;
export interface T114 {
  newInstance: any;
  extend: typeof extend_6;
}
export interface T115 {
  vtkAbstractRepresentationProxy: T101;
  vtkLookupTableProxy: T105;
  vtkPiecewiseFunctionProxy: T110;
  vtkProxyManager: T111;
  vtkSourceProxy: T112;
  vtkView2DProxy: T113;
  vtkViewProxy: T114;
}
declare const T116: T115;
export default T116;
