export interface T100 {
  OUTSIDE: number;
  NEAR_CENTER: number;
  NEAR_AXIS1: number;
  NEAR_AXIS2: number;
  ON_CENTER: number;
  ON_AXIS1: number;
  ON_AXIS2: number;
}
export const InteractionState: T100;
export interface T101 {
  NONE: number;
  PAN_AND_ROTATE: number;
  ROTATE_BOTH_AXES: number;
}
export const ManipulationMode: T101;
