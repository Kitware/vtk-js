export interface T100 {
  position: number;
  height: number;
  width: number;
  xBias: number;
  yBias: number;
}
export interface T101 {
  x: number;
  y: number;
  midpoint: number;
  sharpness: number;
}
export interface T102 {
  Gaussians: T100[];
  Points: Array<number[]>;
  Nodes: T101[];
}
export interface T103 {
  Gaussians: number;
  Points: number;
  Nodes: number;
}
export interface T104 {
  Defaults: T102;
  Mode: T103;
}
declare const T105: T104;
export default T105;
