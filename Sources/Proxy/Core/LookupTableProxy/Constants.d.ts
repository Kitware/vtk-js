// [x, r/h, g/s, b/v, m=0.5, s=0.0]
type RGBHSVPoint = [number, number, number, number, number?, number?];

/**
 * The module exposes these only through its default object; there are no named
 * runtime exports to declare.
 */
declare const _default: {
  Mode: {
    readonly Preset: 0;
    readonly RGBPoints: 1;
    readonly HSVPoints: 2;
    readonly Nodes: 3;
  };
  Defaults: {
    Preset: string;
    RGBPoints: RGBHSVPoint[];
    HSVPoints: RGBHSVPoint[];
    Nodes: {
      x: number;
      r: number;
      g: number;
      b: number;
      midpoint: number;
      sharpness: number;
    }[];
  };
};
export default _default;
