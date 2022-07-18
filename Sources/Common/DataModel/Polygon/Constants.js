export const EPSILON = 1e-6;
export const FLOAT_EPSILON = 1.1920929e-7;
export const TOLERANCE = 1e-8;

export const PolygonWithPointIntersectionState = {
  FAILURE: -1,
  OUTSIDE: 0,
  INSIDE: 1,
};
export const VTK_DBL_EPSILON = 2.2204460492503131e-16;

export const PolygonWithCellIntersectionState = {
  NO_INTERSECTION: 0,
  POINT_INTERSECTION: 1,
  LINE_INTERSECTION: 2,
  OVERLAP: 3,
  INCLUDED: 4,
};

export default { PolygonWithPointIntersectionState };
