declare function applyGaussianToPiecewiseFunction(gaussians: any, sampling: any, rangeToUse: any, piecewiseFunction: any): void;
declare function computeOpacities(gaussians: any, sampling?: number): number[];
declare function createListener(callback: any, preventDefault?: boolean): (e: any) => void;
export interface T100 {
  lineWidth: number;
  strokeStyle: string;
}
declare function drawChart(ctx: any, area: any, values: any, style?: T100): void;
declare function findGaussian(x: any, gaussians: any): any;
declare function listenerSelector(condition: any, ok: any, ko: any): (e: any) => any;
declare function normalizeCoordinates(x: any, y: any, subRectangeArea: any, zoomRange?: number[]): number[];
export interface T101 {
  applyGaussianToPiecewiseFunction: typeof applyGaussianToPiecewiseFunction;
  computeOpacities: typeof computeOpacities;
  createListener: typeof createListener;
  drawChart: typeof drawChart;
  findGaussian: typeof findGaussian;
  listenerSelector: typeof listenerSelector;
  normalizeCoordinates: typeof normalizeCoordinates;
}
export const STATIC: T101;
export interface T102 {
  [key: string]: any;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T102): void;
export const extend: typeof extend_1;
export const newInstance: any;
export interface T103 {
  applyGaussianToPiecewiseFunction: typeof applyGaussianToPiecewiseFunction;
  computeOpacities: typeof computeOpacities;
  createListener: typeof createListener;
  drawChart: typeof drawChart;
  findGaussian: typeof findGaussian;
  listenerSelector: typeof listenerSelector;
  normalizeCoordinates: typeof normalizeCoordinates;
  newInstance: any;
  extend: typeof extend_1;
}
declare const T104: T103;
export default T104;
