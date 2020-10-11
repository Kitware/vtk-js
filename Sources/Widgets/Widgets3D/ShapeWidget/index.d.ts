export interface T100 {
  [key: string]: any;
}
export interface T101 {
  None: T100;
}
export interface T102 {
  manipulator: any;
  visibleOnFocus: boolean;
  modifierBehavior: T101;
  keysDown: T100;
  resetAfterPointPlacement: boolean;
  useHandles: boolean;
  pixelScale: number;
}
export const DEFAULT_VALUES: T102;
export interface T103 {
  DEFAULT_VALUES: T102;
}
declare const T104: T103;
export default T104;
