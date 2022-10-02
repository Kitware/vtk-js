// Boundary conditions available to compute open splines
// DEFAULT : desired slope at boundary point is derivative from two points (boundary and second interior)
// DERIVATIVE : desired slope at boundary point is the boundary value given.
// SECOND_DERIVATIVE : second derivative at boundary point is the boundary value given.
// SECOND_DERIVATIVE_INTERIOR_POINT : desired second derivative at boundary point is the boundary value given times second derivative
// at first interior point.

export const BoundaryCondition = {
  DEFAULT: 0,
  DERIVATIVE: 1,
  SECOND_DERIVATIVE: 2,
  SECOND_DERIVATIVE_INTERIOR_POINT: 3,
};

export default {
  BoundaryCondition,
};
