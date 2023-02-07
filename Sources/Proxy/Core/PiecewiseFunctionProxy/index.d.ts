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

export enum IPiecewiseFunctionProxyMode {
  Gaussians = 0,
  Points = 1,
  Nodes = 2,
}

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
}

export interface IPiecewiseFunctionProxyInitialValues {
  piecewiseFunction?: vtkPiecewiseFunction;
}

export function newInstance(
  initialValues?: IPiecewiseFunctionProxyInitialValues
): vtkPiecewiseFunctionProxy;

export declare const vtkPiecewiseFunctionProxy: {
  newInstance: typeof newInstance;
  Mode: typeof IPiecewiseFunctionProxyMode;
  Defaults: IPiecewiseFunctionProxyDefaults;
};
export default vtkPiecewiseFunctionProxy;
