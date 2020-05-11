export namespace FieldDataTypes {
    export const UNIFORM: number;
    export const DATA_OBJECT_FIELD: number;
    export const COORDINATE: number;
    export const POINT_DATA: number;
    export const POINT: number;
    export const POINT_FIELD_DATA: number;
    export const CELL: number;
    export const CELL_FIELD_DATA: number;
    export const VERTEX: number;
    export const VERTEX_FIELD_DATA: number;
    export const EDGE: number;
    export const EDGE_FIELD_DATA: number;
    export const ROW: number;
    export const ROW_DATA: number;
}
export namespace FieldAssociations {
    export const FIELD_ASSOCIATION_POINTS: number;
    export const FIELD_ASSOCIATION_CELLS: number;
    export const FIELD_ASSOCIATION_NONE: number;
    export const FIELD_ASSOCIATION_POINTS_THEN_CELLS: number;
    export const FIELD_ASSOCIATION_VERTICES: number;
    export const FIELD_ASSOCIATION_EDGES: number;
    export const FIELD_ASSOCIATION_ROWS: number;
    export const NUMBER_OF_ASSOCIATIONS: number;
}
declare namespace _default {
    export { FieldDataTypes };
    export { FieldAssociations };
}
export default _default;
