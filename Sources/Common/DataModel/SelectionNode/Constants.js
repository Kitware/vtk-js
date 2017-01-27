/**
 * The (primary) property that describes the content of a selection
 * node's data. Other auxiliary description properties follow.
 * GLOBALIDS means that the selection list contains values from the
 * vtkDataSetAttribute array of the same name.
 * PEDIGREEIDS means that the selection list contains values from the
 * vtkDataSetAttribute array of the same name.
 * VALUES means the the selection list contains values from an
 * arbitrary attribute array (ignores any globalids attribute)
 * INDICES means that the selection list contains indexes into the
 * cell or point arrays.
 * FRUSTUM means the set of points and cells inside a frustum
 * LOCATIONS means the set of points and cells near a set of positions
 * THRESHOLDS means the points and cells with values within a set of ranges
 * getContentType() returns -1 if the content type is not set.
 */

// Specify how data arrays can be used by data objects
export const SelectionContent = {
  GLOBALIDS: 0,
  PEDIGREEIDS: 1,
  VALUES: 2,
  INDICES: 3,
  FRUSTUM: 4,
  LOCATIONS: 5,
  THRESHOLDS: 6,
  BLOCKS: 7,
  QUERY: 8,
};

export const SelectionField = {
  CELL: 0,
  POINT: 1,
  FIELD: 2,
  VERTEX: 3,
  EDGE: 4,
  ROW: 5,
};

export default {
  SelectionContent,
  SelectionField,
};
