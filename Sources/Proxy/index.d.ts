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
declare function extend_7(publicAPI: any, model: any, initialValues?: T100): void;
export interface T116 {
  newInstance: any;
  extend: typeof extend_7;
}
declare function extend_8(publicAPI: any, model: any, initialValues?: T100): void;
export interface T117 {
  newInstance: any;
  extend: typeof extend_8;
}
declare function extend_9(publicAPI: any, model: any, initialValues?: T100): void;
export interface T118 {
  newInstance: any;
  extend: typeof extend_9;
}
declare function extend_10(publicAPI: any, model: any, initialValues?: T100): void;
export interface T119 {
  newInstance: any;
  extend: typeof extend_10;
}
declare function extend_11(publicAPI: any, model: any, initialValues?: T100): void;
export interface T120 {
  newInstance: any;
  extend: typeof extend_11;
}
declare function extend_12(publicAPI: any, model: any, initialValues?: T100): void;
export interface T121 {
  newInstance: any;
  extend: typeof extend_12;
}
declare function extend_13(publicAPI: any, model: any, initialValues?: T100): void;
export interface T123 {
  mapper: any;
  property: any;
}
declare function updateConfiguration(dataset: any, dataArray: any, T122: T123): void;
export interface T124 {
  newInstance: any;
  extend: typeof extend_13;
  updateConfiguration: typeof updateConfiguration;
}
export interface T125 {
  vtkGeometryRepresentationProxy: T116;
  vtkGlyphRepresentationProxy: T117;
  vtkMoleculeRepresentationProxy: T118;
  vtkSkyboxRepresentationProxy: T119;
  vtkSliceRepresentationProxy: T120;
  vtkSlicedGeometryRepresentationProxy: T121;
  vtkVolumeRepresentationProxy: T124;
}
export interface T126 {
  Core: T115;
  Representations: T125;
}
declare const T127: T126;
export default T127;
