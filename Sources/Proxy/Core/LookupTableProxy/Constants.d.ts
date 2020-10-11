export interface T100 {
  x: number;
  r: number;
  g: number;
  b: number;
  midpoint: number;
  sharpness: number;
}
export interface T101 {
  Preset: string;
  RGBPoints: Array<number[]>;
  HSVPoints: Array<number[]>;
  Nodes: T100[];
}
export interface T102 {
  Preset: number;
  RGBPoints: number;
  HSVPoints: number;
  Nodes: number;
}
export interface T103 {
  Defaults: T101;
  Mode: T102;
}
declare const T104: T103;
export default T104;
