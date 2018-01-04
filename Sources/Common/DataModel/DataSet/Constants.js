// Specify how data arrays can be used by data objects
export const FieldDataTypes = {
  UNIFORM: 0, // data that does not vary over points/cells/etc.
  DATA_OBJECT_FIELD: 0, // to match VTK

  COORDINATE: 1, // data that specifies the location of each point
  POINT_DATA: 1, // to match VTK

  POINT: 2, // data defined at each point, but that does not specify the point location
  POINT_FIELD_DATA: 2, // to match VTK

  CELL: 3, // data defined at each cell, but that does not specify the cell
  CELL_FIELD_DATA: 3, // to match VTK

  VERTEX: 4, // data defined at each graph vertex, but that does not specify the graph vertex
  VERTEX_FIELD_DATA: 4, // to match VTK

  EDGE: 5, // data defined at each graph edge, but that does not specify the graph edge
  EDGE_FIELD_DATA: 5, // to match VTK

  ROW: 6, // data specifying a table row
  ROW_DATA: 6, // to match VTK
};

export const FieldAssociations = {
  FIELD_ASSOCIATION_POINTS: 0,
  FIELD_ASSOCIATION_CELLS: 1,
  FIELD_ASSOCIATION_NONE: 2,
  FIELD_ASSOCIATION_POINTS_THEN_CELLS: 3,
  FIELD_ASSOCIATION_VERTICES: 4,
  FIELD_ASSOCIATION_EDGES: 5,
  FIELD_ASSOCIATION_ROWS: 6,
  NUMBER_OF_ASSOCIATIONS: 7,
};

export default {
  FieldDataTypes,
  FieldAssociations,
};
