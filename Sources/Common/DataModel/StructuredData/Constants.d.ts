export interface T100 {
  UNCHANGED: number;
  SINGLE_POINT: number;
  X_LINE: number;
  Y_LINE: number;
  Z_LINE: number;
  XY_PLANE: number;
  YZ_PLANE: number;
  XZ_PLANE: number;
  XYZ_GRID: number;
  EMPTY: number;
}
export const StructuredType: T100;
export interface T101 {
  StructuredType: T100;
}
declare const T102: T101;
export default T102;
