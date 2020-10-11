export interface T100 {
  POINTS: string;
  PLACEMENT: string;
  RATIO: string;
}
export const BehaviorCategory: T100;
export interface T101 {
  [key: string]: any;
}
export const ShapeBehavior: T101;
export interface T102 {
  OUTSIDE_LEFT: string;
  INSIDE_LEFT: string;
  OUTSIDE_RIGHT: string;
  INSIDE_RIGHT: string;
  MIDDLE: string;
}
export const HorizontalTextPosition: T102;
export interface T103 {
  OUTSIDE_TOP: string;
  INSIDE_TOP: string;
  OUTSIDE_BOTTOM: string;
  INSIDE_BOTTOM: string;
  MIDDLE: string;
}
export const VerticalTextPosition: T103;
declare function computeTextPosition_1(bounds: any, horizontalPosition: any, verticalPosition: any, textWidth: any, textHeight: any): number[];
export const computeTextPosition: typeof computeTextPosition_1;
declare const ShapeBehavior_1: T101;
export default ShapeBehavior_1;
