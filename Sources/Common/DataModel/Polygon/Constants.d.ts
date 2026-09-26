export declare const EPSILON: number;
export declare const FLOAT_EPSILON: number;
export declare const TOLERANCE: number;

/**
 * Different states which pointInPolygon could return.
 */
export declare const PolygonWithPointIntersectionState: {
  readonly FAILURE: -1;
  readonly OUTSIDE: 0;
  readonly INSIDE: 1;
  readonly INTERSECTION: 2;
  readonly ON_LINE: 3;
};

export type PolygonWithPointIntersectionState =
  (typeof PolygonWithPointIntersectionState)[keyof typeof PolygonWithPointIntersectionState];
