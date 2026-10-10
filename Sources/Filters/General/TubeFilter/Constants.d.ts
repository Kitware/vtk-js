export declare const VaryRadius: {
  readonly VARY_RADIUS_OFF: 0;
  readonly VARY_RADIUS_BY_SCALAR: 1;
  readonly VARY_RADIUS_BY_VECTOR: 2;
  readonly VARY_RADIUS_BY_ABSOLUTE_SCALAR: 3;
};

export type VaryRadius = (typeof VaryRadius)[keyof typeof VaryRadius];

export declare const GenerateTCoords: {
  readonly TCOORDS_OFF: 0;
  readonly TCOORDS_FROM_NORMALIZED_LENGTH: 1;
  readonly TCOORDS_FROM_LENGTH: 2;
  readonly TCOORDS_FROM_SCALARS: 3;
};

export type GenerateTCoords =
  (typeof GenerateTCoords)[keyof typeof GenerateTCoords];

declare const _default: {
  VaryRadius: typeof VaryRadius;
  GenerateTCoords: typeof GenerateTCoords;
};
export default _default;
