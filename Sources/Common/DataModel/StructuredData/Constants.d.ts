export declare const StructuredType: {
  readonly UNCHANGED: 0;
  readonly SINGLE_POINT: 1;
  readonly X_LINE: 2;
  readonly Y_LINE: 3;
  readonly Z_LINE: 4;
  readonly XY_PLANE: 5;
  readonly YZ_PLANE: 6;
  readonly XZ_PLANE: 7;
  readonly XYZ_GRID: 8;
  readonly EMPTY: 9;
};

export type StructuredType =
  (typeof StructuredType)[keyof typeof StructuredType];

declare const _default: {
  StructuredType: typeof StructuredType;
};
export default _default;
