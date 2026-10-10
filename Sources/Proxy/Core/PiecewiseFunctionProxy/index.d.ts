import vtkLookupTableProxy from '../LookupTableProxy';
import vtkPiecewiseFunction from '../../../Common/DataModel/PiecewiseFunction';
import { VtkProxy } from '../../../macros';

// [x, r/h, g/s, b/v, m=0.5, s=0.0]
export interface PiecewiseGaussian {
  position: number;
  height: number;
  width: number;
  xBias: number;
  yBias: number;
}

export interface PiecewiseNode {
  x: number;
  y: number;
  midpoint: number;
  sharpness: number;
}

declare enum IPiecewiseFunctionProxyMode {
  Gaussians = 0,
  Points = 1,
  Nodes = 2,
}

/**
 * The type is public; the value is reached through the module default export.
 */
export type { IPiecewiseFunctionProxyMode };

export interface IPiecewiseFunctionProxyDefaults {
  Gaussians: PiecewiseGaussian[];
  Points: number[][];
  Nodes: PiecewiseNode[];
}

export interface vtkPiecewiseFunctionProxy extends VtkProxy {
  setGaussians(gaussians: PiecewiseGaussian[]): void;
  getGaussians(): PiecewiseGaussian[];
  setPoints(points: number[][]): void;
  getPoints(): number[][];
  setNodes(nodes: PiecewiseNode[]): void;
  getNodes(): PiecewiseNode[];
  setMode(mode: number): void;
  getMode(): number;
  applyMode(): void;
  getLookupTableProxy(): vtkLookupTableProxy;
  setDataRange(min: number, max: number): void;
  getDataRange(): [number, number];
  getPiecewiseFunction(): vtkPiecewiseFunction;
  setArrayName(arrayName: string): boolean;
  getArrayName(): string;
}

export interface IPiecewiseFunctionProxyInitialValues {
  arrayName?: string;
  dataRange?: [number, number];
  gaussians?: PiecewiseGaussian[];
  mode?: number;
  nodes?: PiecewiseNode[];
  points?: number[][];
  piecewiseFunction?: vtkPiecewiseFunction;
}

declare function extend(
  publicAPI: object,
  model: object,
  initialValues?: IPiecewiseFunctionProxyInitialValues
): void;

export function newInstance(
  initialValues?: IPiecewiseFunctionProxyInitialValues
): vtkPiecewiseFunctionProxy;

export declare const vtkPiecewiseFunctionProxy: {
  newInstance: typeof newInstance;
  extend: typeof extend;
  Mode: typeof IPiecewiseFunctionProxyMode;
  Defaults: IPiecewiseFunctionProxyDefaults;
};
export default vtkPiecewiseFunctionProxy;
