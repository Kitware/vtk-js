export declare const CellType: {
  // Linear cells
  readonly VTK_EMPTY_CELL: 0;
  readonly VTK_VERTEX: 1;
  readonly VTK_POLY_VERTEX: 2;
  readonly VTK_LINE: 3;
  readonly VTK_POLY_LINE: 4;
  readonly VTK_TRIANGLE: 5;
  readonly VTK_TRIANGLE_STRIP: 6;
  readonly VTK_POLYGON: 7;
  readonly VTK_PIXEL: 8;
  readonly VTK_QUAD: 9;
  readonly VTK_TETRA: 10;
  readonly VTK_VOXEL: 11;
  readonly VTK_HEXAHEDRON: 12;
  readonly VTK_WEDGE: 13;
  readonly VTK_PYRAMID: 14;
  readonly VTK_PENTAGONAL_PRISM: 15;
  readonly VTK_HEXAGONAL_PRISM: 16;

  // Quadratic, isoparametric cells
  readonly VTK_QUADRATIC_EDGE: 21;
  readonly VTK_QUADRATIC_TRIANGLE: 22;
  readonly VTK_QUADRATIC_QUAD: 23;
  readonly VTK_QUADRATIC_POLYGON: 36;
  readonly VTK_QUADRATIC_TETRA: 24;
  readonly VTK_QUADRATIC_HEXAHEDRON: 25;
  readonly VTK_QUADRATIC_WEDGE: 26;
  readonly VTK_QUADRATIC_PYRAMID: 27;
  readonly VTK_BIQUADRATIC_QUAD: 28;
  readonly VTK_TRIQUADRATIC_HEXAHEDRON: 29;
  readonly VTK_QUADRATIC_LINEAR_QUAD: 30;
  readonly VTK_QUADRATIC_LINEAR_WEDGE: 31;
  readonly VTK_BIQUADRATIC_QUADRATIC_WEDGE: 32;
  readonly VTK_BIQUADRATIC_QUADRATIC_HEXAHEDRON: 33;
  readonly VTK_BIQUADRATIC_TRIANGLE: 34;

  // Cubic, isoparametric cell
  readonly VTK_CUBIC_LINE: 35;

  // Special class of cells formed by convex group of points
  readonly VTK_CONVEX_POINT_SET: 41;

  // Polyhedron cell (consisting of polygonal faces)
  readonly VTK_POLYHEDRON: 42;

  // Higher order cells in parametric form
  readonly VTK_PARAMETRIC_CURVE: 51;
  readonly VTK_PARAMETRIC_SURFACE: 52;
  readonly VTK_PARAMETRIC_TRI_SURFACE: 53;
  readonly VTK_PARAMETRIC_QUAD_SURFACE: 54;
  readonly VTK_PARAMETRIC_TETRA_REGION: 55;
  readonly VTK_PARAMETRIC_HEX_REGION: 56;

  // Higher order cells
  readonly VTK_HIGHER_ORDER_EDGE: 60;
  readonly VTK_HIGHER_ORDER_TRIANGLE: 61;
  readonly VTK_HIGHER_ORDER_QUAD: 62;
  readonly VTK_HIGHER_ORDER_POLYGON: 63;
  readonly VTK_HIGHER_ORDER_TETRAHEDRON: 64;
  readonly VTK_HIGHER_ORDER_WEDGE: 65;
  readonly VTK_HIGHER_ORDER_PYRAMID: 66;
  readonly VTK_HIGHER_ORDER_HEXAHEDRON: 67;

  // Arbitrary order Lagrange elements (formulated separated from generic higher order cells)
  readonly VTK_LAGRANGE_CURVE: 68;
  readonly VTK_LAGRANGE_TRIANGLE: 69;
  readonly VTK_LAGRANGE_QUADRILATERAL: 70;
  readonly VTK_LAGRANGE_TETRAHEDRON: 71;
  readonly VTK_LAGRANGE_HEXAHEDRON: 72;
  readonly VTK_LAGRANGE_WEDGE: 73;
  readonly VTK_LAGRANGE_PYRAMID: 74;

  readonly VTK_NUMBER_OF_CELL_TYPES: 75;
};

export type CellType = (typeof CellType)[keyof typeof CellType];

export declare const CellTypesStrings: string[];

declare const _default: {
  CellType: typeof CellType;
  CellTypesStrings: typeof CellTypesStrings;
};
export default _default;
