export declare const CoordinateSystem: {
  readonly WORLD: 0;
  readonly DISPLAY: 1;
};

export type CoordinateSystem =
  (typeof CoordinateSystem)[keyof typeof CoordinateSystem];

declare const _default: {
  CoordinateSystem: typeof CoordinateSystem;
};
export default _default;
