export interface T100 {
  LEFT: string;
  RIGHT: string;
  CENTER: string;
}
export const TextAlign: T100;
export interface T101 {
  TOP: string;
  BOTTOM: string;
  CENTER: string;
}
export const VerticalAlign: T101;
export interface T102 {
  TextAlign: T100;
  VerticalAlign: T101;
}
declare const T103: T102;
export default T103;
