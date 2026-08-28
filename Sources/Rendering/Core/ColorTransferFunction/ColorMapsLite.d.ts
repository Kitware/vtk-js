/**
 * vtkColorMaps represents a global registry of preset color maps.
 */

import { Vector3 } from '../../../types';

export interface IColorMapPreset {
  Name: string;
  Creator?: string;
  Notes?: string;
  Source?: string;
  License?: string;
  ColorSpace?: string;
  NanColor?: Vector3;
  BelowRangeColor?: Vector3;
  AboveRangeColor?: Vector3;
  /**
   * Always present on presets reachable through this module: both the built-in
   * preset table and `addPreset` reject presets without RGBPoints.
   */
  RGBPoints: number[];
  IndexedColors?: number[];
  Annotations?: (number | string)[];
  ShowIndexedColorActiveValues?: number;
}

declare const vtkColorMaps: {
  addPreset(preset: IColorMapPreset): void;
  removePresetByName(name: string): void;
  /**
   * Undefined when no preset carries that name.
   */
  getPresetByName(name: string): IColorMapPreset | undefined;
  rgbPresetNames: string[];
};

export default vtkColorMaps;
