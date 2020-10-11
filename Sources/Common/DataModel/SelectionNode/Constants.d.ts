export interface T100 {
  GLOBALIDS: number;
  PEDIGREEIDS: number;
  VALUES: number;
  INDICES: number;
  FRUSTUM: number;
  LOCATIONS: number;
  THRESHOLDS: number;
  BLOCKS: number;
  QUERY: number;
}
export const SelectionContent: T100;
export interface T101 {
  CELL: number;
  POINT: number;
  FIELD: number;
  VERTEX: number;
  EDGE: number;
  ROW: number;
}
export const SelectionField: T101;
export interface T102 {
  SelectionContent: T100;
  SelectionField: T101;
}
declare const T103: T102;
export default T103;
