export declare const SolidType: {
  readonly VTK_SOLID_TETRAHEDRON: 0;
  readonly VTK_SOLID_CUBE: 1;
  readonly VTK_SOLID_OCTAHEDRON: 2;
  readonly VTK_SOLID_ICOSAHEDRON: 3;
  readonly VTK_SOLID_DODECAHEDRON: 4;
};

export type SolidType = (typeof SolidType)[keyof typeof SolidType];

declare const _default: {
  SolidType: typeof SolidType;
};
export default _default;
