export interface T100 {
  FLAT: number;
  GOURAUD: number;
  PHONG: number;
}
export const Shading: T100;
export interface T101 {
  POINTS: number;
  WIREFRAME: number;
  SURFACE: number;
}
export const Representation: T101;
export const Interpolation: T100;
export interface T102 {
  Shading: T100;
  Representation: T101;
  Interpolation: T100;
}
declare const T103: T102;
export default T103;
