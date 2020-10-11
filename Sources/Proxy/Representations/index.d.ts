export interface T100 {
  [key: string]: any;
}
declare function extend(publicAPI: any, model: any, initialValues?: T100): void;
export interface T101 {
  newInstance: any;
  extend: typeof extend;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T100): void;
export interface T102 {
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
declare function extend_4(publicAPI: any, model: any, initialValues?: T100): void;
export interface T105 {
  newInstance: any;
  extend: typeof extend_4;
}
declare function extend_5(publicAPI: any, model: any, initialValues?: T100): void;
export interface T106 {
  newInstance: any;
  extend: typeof extend_5;
}
declare function extend_6(publicAPI: any, model: any, initialValues?: T100): void;
export interface T108 {
  mapper: any;
  property: any;
}
declare function updateConfiguration(dataset: any, dataArray: any, T107: T108): void;
export interface T109 {
  newInstance: any;
  extend: typeof extend_6;
  updateConfiguration: typeof updateConfiguration;
}
export interface T110 {
  vtkGeometryRepresentationProxy: T101;
  vtkGlyphRepresentationProxy: T102;
  vtkMoleculeRepresentationProxy: T103;
  vtkSkyboxRepresentationProxy: T104;
  vtkSliceRepresentationProxy: T105;
  vtkSlicedGeometryRepresentationProxy: T106;
  vtkVolumeRepresentationProxy: T109;
}
declare const T111: T110;
export default T111;
