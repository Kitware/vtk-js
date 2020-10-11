export interface T100 {
  label: string;
}
export interface T101 {
  id: string;
  label: string;
  fov: number;
  interLensDistance: number;
  baselineLensDistance: number;
  screenLensDistance: number;
  distortionCoefficients: number[];
  inverseCoefficients: number[];
}
declare const T102: Array<T100 | T101>;
export default T102;
