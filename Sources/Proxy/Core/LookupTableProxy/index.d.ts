import { VtkProxy } from '../../../macros';
import vtkColorTransferFunction from '../../../Rendering/Core/ColorTransferFunction';

// [x, r/h, g/s, b/v, m=0.5, s=0.0]
export type RGBHSVPoint = [number, number, number, number, number?, number?];

export enum Mode {
  Preset = 0,
  RGBPoints = 1,
  HSVPoints = 2,
  Nodes = 3,
}

export interface vtkLookupTableProxy extends VtkProxy {
  setPresetName(name: string): void;
  getPresetName(): string;
  setRGBPoints(points: RGBHSVPoint[]): void;
  getRGBPoints(): RGBHSVPoint[];
  setHSVPoints(points: RGBHSVPoint[]): void;
  getHSVPoints(): RGBHSVPoint[];
  // Node: { x, y, midpoint, sharpness }
  setNodes(nodes: number[][]): void;
  getNodes(nodes): number[][];
  setMode(mode: number): void;
  getMode(): number;
  applyMode(): void;
  setDataRange(min: number, max: number): void;
  getDataRange(): [number, number];
  getLookupTable(): vtkColorTransferFunction;
}

export interface ILookupTableProxyInitialValues {
  lookupTable?: vtkColorTransferFunction;
}

export function newInstance(
  initialValues?: ILookupTableProxyInitialValues
): vtkLookupTableProxy;

export declare const vtkLookupTableProxy: {
  newInstance: typeof newInstance;
  Mode: Mode;
};

export default vtkLookupTableProxy;
