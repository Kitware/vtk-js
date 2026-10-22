/**
 * Boundary conditions available to compute open splines.
 */
export declare const BoundaryCondition: {
  /**
   * Desired slope at boundary point is derivative from two points (boundary and
   * second interior)
   */
  readonly DEFAULT: 0;
  /**
   * Desired slope at boundary point is the boundary value given
   */
  readonly DERIVATIVE: 1;
  /**
   * Second derivative at boundary point is the boundary value given
   */
  readonly SECOND_DERIVATIVE: 2;
  /**
   * Desired second derivative at boundary point is the boundary value given
   * times second derivative at first interior point
   */
  readonly SECOND_DERIVATIVE_INTERIOR_POINT: 3;
};

export type BoundaryCondition =
  (typeof BoundaryCondition)[keyof typeof BoundaryCondition];

declare const _default: {
  BoundaryCondition: typeof BoundaryCondition;
};
export default _default;
