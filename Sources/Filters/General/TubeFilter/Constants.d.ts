export interface T100 {
  VARY_RADIUS_OFF: number;
  VARY_RADIUS_BY_SCALAR: number;
  VARY_RADIUS_BY_VECTOR: number;
  VARY_RADIUS_BY_ABSOLUTE_SCALAR: number;
}
export const VaryRadius: T100;
export interface T101 {
  TCOORDS_OFF: number;
  TCOORDS_FROM_NORMALIZED_LENGTH: number;
  TCOORDS_FROM_LENGTH: number;
  TCOORDS_FROM_SCALARS: number;
}
export const GenerateTCoords: T101;
export interface T102 {
  VaryRadius: T100;
  GenerateTCoords: T101;
}
declare const T103: T102;
export default T103;
