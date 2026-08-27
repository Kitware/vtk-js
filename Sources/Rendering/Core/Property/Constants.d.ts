export declare const Shading: {
  readonly FLAT: 0;
  readonly GOURAUD: 1;
  readonly PHONG: 2;
};

export type Shading = (typeof Shading)[keyof typeof Shading];

export declare const Representation: {
  readonly POINTS: 0;
  readonly WIREFRAME: 1;
  readonly SURFACE: 2;
};

export type Representation =
  (typeof Representation)[keyof typeof Representation];

export declare const Interpolation: {
  readonly FLAT: 0;
  readonly GOURAUD: 1;
  readonly PHONG: 2;
};

export type Interpolation = (typeof Interpolation)[keyof typeof Interpolation];

declare const _default: {
  Shading: typeof Shading;
  Representation: typeof Representation;
  Interpolation: typeof Interpolation;
};
export default _default;
