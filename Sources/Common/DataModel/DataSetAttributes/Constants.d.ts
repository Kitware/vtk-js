export interface T100 {
  SCALARS: number;
  VECTORS: number;
  NORMALS: number;
  TCOORDS: number;
  TENSORS: number;
  GLOBALIDS: number;
  PEDIGREEIDS: number;
  EDGEFLAG: number;
  NUM_ATTRIBUTES: number;
}
export const AttributeTypes: T100;
export interface T101 {
  MAX: number;
  EXACT: number;
  NOLIMIT: number;
}
export const AttributeLimitTypes: T101;
export interface T102 {
  DUPLICATECELL: number;
  HIGHCONNECTIVITYCELL: number;
  LOWCONNECTIVITYCELL: number;
  REFINEDCELL: number;
  EXTERIORCELL: number;
  HIDDENCELL: number;
}
export const CellGhostTypes: T102;
export interface T103 {
  DUPLICATEPOINT: number;
  HIDDENPOINT: number;
}
export const PointGhostTypes: T103;
export interface T104 {
  COPYTUPLE: number;
  INTERPOLATE: number;
  PASSDATA: number;
  ALLCOPY: number;
}
export const AttributeCopyOperations: T104;
export const ghostArrayName: string;
export interface T105 {
  DEFAULT: number;
  SINGLE: number;
  DOUBLE: number;
}
export const DesiredOutputPrecision: T105;
export interface T106 {
  AttributeCopyOperations: T104;
  AttributeLimitTypes: T101;
  AttributeTypes: T100;
  CellGhostTypes: T102;
  DesiredOutputPrecision: T105;
  PointGhostTypes: T103;
  ghostArrayName: string;
}
declare const T107: T106;
export default T107;
