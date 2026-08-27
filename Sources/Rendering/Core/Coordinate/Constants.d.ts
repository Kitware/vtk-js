export declare const Coordinate: {
  readonly DISPLAY: 0;
  readonly NORMALIZED_DISPLAY: 1;
  readonly VIEWPORT: 2;
  readonly NORMALIZED_VIEWPORT: 3;
  readonly PROJECTION: 4;
  readonly VIEW: 5;
  readonly WORLD: 6;
};

export type Coordinate = (typeof Coordinate)[keyof typeof Coordinate];

declare const _default: {
  Coordinate: typeof Coordinate;
};
export default _default;
