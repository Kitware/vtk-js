/**
 * The module exposes these only through its default object; there are no named
 * runtime exports to declare.
 */
declare const _default: {
  Defaults: {
    Gaussians: {
      position: number;
      height: number;
      width: number;
      xBias: number;
      yBias: number;
    }[];
    Points: number[][];
    Nodes: { x: number; y: number; midpoint: number; sharpness: number }[];
  };
  Mode: {
    readonly Gaussians: 0;
    readonly Points: 1;
    readonly Nodes: 2;
  };
};
export default _default;
