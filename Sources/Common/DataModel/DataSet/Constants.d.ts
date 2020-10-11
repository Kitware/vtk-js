export interface T100 {
  UNIFORM: number;
  DATA_OBJECT_FIELD: number;
  COORDINATE: number;
  POINT_DATA: number;
  POINT: number;
  POINT_FIELD_DATA: number;
  CELL: number;
  CELL_FIELD_DATA: number;
  VERTEX: number;
  VERTEX_FIELD_DATA: number;
  EDGE: number;
  EDGE_FIELD_DATA: number;
  ROW: number;
  ROW_DATA: number;
}
export const FieldDataTypes: T100;
export interface T101 {
  FIELD_ASSOCIATION_POINTS: number;
  FIELD_ASSOCIATION_CELLS: number;
  FIELD_ASSOCIATION_NONE: number;
  FIELD_ASSOCIATION_POINTS_THEN_CELLS: number;
  FIELD_ASSOCIATION_VERTICES: number;
  FIELD_ASSOCIATION_EDGES: number;
  FIELD_ASSOCIATION_ROWS: number;
  NUMBER_OF_ASSOCIATIONS: number;
}
export const FieldAssociations: T101;
export interface T102 {
  FieldDataTypes: T100;
  FieldAssociations: T101;
}
declare const T103: T102;
export default T103;
