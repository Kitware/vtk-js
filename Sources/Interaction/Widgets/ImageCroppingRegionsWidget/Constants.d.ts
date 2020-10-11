export interface T100 {
  IDLE: number;
  CROPPING: number;
}
export interface T101 {
  TOTAL_NUM_HANDLES: number;
  WidgetState: T100;
  CropWidgetEvents: string[];
}
declare const T102: T101;
export default T102;
