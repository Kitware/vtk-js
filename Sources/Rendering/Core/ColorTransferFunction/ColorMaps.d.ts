/**
 * vtkColorMaps represents a global registry of preset color maps.
 */

import { Vector3 } from '../../../types';

export interface IColorMapPreset {
  Name: string;
  Creator?: string;
  ColorSpace?: string;
  NanColor?: Vector3;
  RGBPoints: number[];
  IndexedColors?: number[];
  Annotations?: (number | string)[];
}

export declare const vtkColorMaps: {
  addPreset(preset: IColorMapPreset): void;
  removePresetByName(name: string): void;
  getPresetByName(name: string): IColorMapPreset;
  rgbPresetNames: string[];
};

export default vtkColorMaps;
