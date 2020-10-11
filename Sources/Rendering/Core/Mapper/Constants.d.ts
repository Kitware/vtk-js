export interface T100 {
  DEFAULT: number;
  MAP_SCALARS: number;
  DIRECT_SCALARS: number;
}
export const ColorMode: T100;
export interface T101 {
  DEFAULT: number;
  USE_POINT_DATA: number;
  USE_CELL_DATA: number;
  USE_POINT_FIELD_DATA: number;
  USE_CELL_FIELD_DATA: number;
  USE_FIELD_DATA: number;
}
export const ScalarMode: T101;
export interface T102 {
  BY_ID: number;
  BY_NAME: number;
}
export const GetArray: T102;
export interface T103 {
  ColorMode: T100;
  GetArray: T102;
  ScalarMode: T101;
}
declare const T104: T103;
export default T104;
