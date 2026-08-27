export declare const FieldAssociations: {
  readonly FIELD_ASSOCIATION_POINTS: 0;
  readonly FIELD_ASSOCIATION_CELLS: 1;
  readonly FIELD_ASSOCIATION_NONE: 2;
  readonly FIELD_ASSOCIATION_POINTS_THEN_CELLS: 3;
  readonly FIELD_ASSOCIATION_VERTICES: 4;
  readonly FIELD_ASSOCIATION_EDGES: 5;
  readonly FIELD_ASSOCIATION_ROWS: 6;
  readonly NUMBER_OF_ASSOCIATIONS: 7;
};

export type FieldAssociations =
  (typeof FieldAssociations)[keyof typeof FieldAssociations];

export declare const FieldDataTypes: {
  readonly UNIFORM: 0;
  readonly DATA_OBJECT_FIELD: 0;
  readonly COORDINATE: 1;
  readonly POINT_DATA: 1;
  readonly POINT: 2;
  readonly POINT_FIELD_DATA: 2;
  readonly CELL: 3;
  readonly CELL_FIELD_DATA: 3;
  readonly VERTEX: 4;
  readonly VERTEX_FIELD_DATA: 4;
  readonly EDGE: 5;
  readonly EDGE_FIELD_DATA: 5;
  readonly ROW: 6;
  readonly ROW_DATA: 6;
};

export type FieldDataTypes =
  (typeof FieldDataTypes)[keyof typeof FieldDataTypes];

declare const _default: {
  FieldDataTypes: typeof FieldDataTypes;
  FieldAssociations: typeof FieldAssociations;
};
export default _default;
