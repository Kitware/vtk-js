import { vtkObject } from '../../../interfaces';
import { Range, RGBAColor } from '../../../types';
import vtkDataArray from '../DataArray';
import { ScalarMappingTarget } from '../ScalarsToColors/Constants';
import vtkScalarsToColors from '../ScalarsToColors';

/**
 *
 */
export interface ILookupTableInitialValues {
  aboveRangeColor?: RGBAColor;
  alphaRange?: Range;
  belowRangeColor?: RGBAColor;
  hueRange?: Range;
  nanColor?: RGBAColor;
  numberOfColors?: number;
  saturationRange?: Range;
  useAboveRangeColor?: boolean;
  useBelowRangeColor?: boolean;
  valueRange?: Range;
}

export interface vtkLookupTable extends vtkScalarsToColors {
  /** Return whether all colors in the table are opaque. */
  isOpaque(): boolean;

  /** Lookup tables do not use logarithmic scaling. */
  usingLogScale(): boolean;

  /** Build the table if it is stale or empty. */
  build(): void;

  /** Map scalar values through the lookup table into the supplied output. */
  mapScalarsThroughTable(
    input: vtkDataArray,
    output: vtkDataArray,
    outFormat: ScalarMappingTarget,
    inputOffset: number
  ): void;
  /**
   *
   */
  buildSpecialColors(): void;

  /**
   *
   */
  forceBuild(): void;

  /**
   *
   */
  getAboveRangeColor(): RGBAColor;

  /**
   *
   */
  getAboveRangeColorByReference(): RGBAColor;

  /**
   *
   */
  getAlphaRange(): Range;

  /**
   *
   */
  getAlphaRangeByReference(): Range;

  /**
   * The timestamp of the last color table build.
   */
  getBuildTime(): vtkObject;

  /**
   *
   */
  getBelowRangeColor(): RGBAColor;

  /**
   *
   */
  getBelowRangeColorByReference(): RGBAColor;

  /**
   *
   */
  getHueRange(): Range;

  /**
   *
   */
  getHueRangeByReference(): Range;

  /**
   *
   */
  getNanColor(): RGBAColor;

  /**
   *
   */
  getNanColorByReference(): RGBAColor;

  /**
   *
   */
  getNumberOfAnnotatedValues(): number;

  /**
   *
   */
  getNumberOfAvailableColors(): number;

  /**
   *
   */
  getNumberOfColors(): number;

  /**
   *
   */
  getRange(): Range;

  /**
   *
   */
  getSaturationRange(): Range;

  /**
   *
   */
  getSaturationRangeByReference(): Range;

  /**
   *
   */
  getUseAboveRangeColor(): boolean;

  /**
   *
   */
  getUseBelowRangeColor(): boolean;

  /**
   *
   */
  getValueRange(): Range;

  /**
   *
   */
  getValueRangeByReference(): Range;

  /**
   *
   * @param v
   * @param table
   * @param p
   */
  indexedLookupFunction(v: number, table: any, p: object): RGBAColor;

  /**
   *
   * @param v
   * @param p
   */
  linearIndexLookup(v: number, p: object): number;

  /**
   *
   * @param v
   * @param table
   * @param p
   */
  linearLookup(v: number, table: any, p: object): RGBAColor;

  /**
   *
   * @param range
   * @param p
   */
  lookupShiftAndScale(range: Range, p: object): void;

  /**
   *
   * @param aboveRangeColor
   */
  setAboveRangeColor(aboveRangeColor: RGBAColor): boolean;

  /**
   *
   * @param aboveRangeColor
   */
  setAboveRangeColorFrom(aboveRangeColor: RGBAColor): void;

  /**
   *
   * @param alphaRange
   */
  setAlphaRange(alphaRange: Range): boolean;

  /**
   *
   * @param alphaRange
   */
  setAlphaRangeFrom(alphaRange: Range): void;

  /**
   *
   * @param belowRangeColor
   */
  setBelowRangeColor(belowRangeColor: RGBAColor): boolean;

  /**
   *
   * @param belowRangeColor
   */
  setBelowRangeColorFrom(belowRangeColor: RGBAColor): void;

  /**
   *
   * @param hueRange
   */
  setHueRange(hueRange: Range): boolean;

  /**
   *
   * @param hueRange
   */
  setHueRangeFrom(hueRange: Range): void;

  /**
   *
   * @param nanColor
   */
  setNanColor(nanColor: RGBAColor): boolean;

  /**
   *
   * @param nanColor
   */
  setNanColorFrom(nanColor: RGBAColor): void;

  /**
   *
   * @param numberOfColors
   */
  setNumberOfColors(numberOfColors: number): boolean;

  /**
   *
   * @param saturationRange
   */
  setSaturationRange(saturationRange: Range): boolean;

  /**
   *
   * @param saturationRange
   */
  setSaturationRangeFrom(saturationRange: Range): void;

  /**
   *
   * @param table
   */
  setTable(table: any): boolean;

  /**
   *
   * @param useAboveRangeColor
   */
  setUseAboveRangeColor(useAboveRangeColor: boolean): boolean;

  /**
   *
   * @param useBelowRangeColor
   */
  setUseBelowRangeColor(useBelowRangeColor: boolean): boolean;

  /**
   *
   * @param valueRange
   */
  setValueRange(valueRange: Range): boolean;

  /**
   *
   * @param valueRange
   */
  setValueRangeFrom(valueRange: Range): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkLookupTable characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ILookupTableInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ILookupTableInitialValues
): void;

/**
 * Method used to create a new instance of vtkLookupTable
 * @param {ILookupTableInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: ILookupTableInitialValues
): vtkLookupTable;

/**
 * vtkLookupTable is a 2D widget for manipulating a marker prop
 */
export declare const vtkLookupTable: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkLookupTable;
