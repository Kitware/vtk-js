import { Nullable, Range } from '../../../types';
import { vtkDataArray } from '../../../Common/Core/DataArray';
import { ColorMode, ScalarMode } from './Constants';

/**
 * Initial values for scalar coloring.
 *
 * A mapper can override these values before it installs the scalar coloring
 * methods. The scalar coloring helper keeps values that the mapper sets.
 */
export interface IScalarColoringInitialValues {
  /** Selects an array by name or by identifier. */
  arrayAccessMode?: number;
  /** Specifies the name of the array that supplies the scalar values. */
  colorByArrayName?: Nullable<string>;
  /** Specifies how the mapper converts scalar values to colors. */
  colorMode?: number;
  /** Specifies the field-data tuple that colors the data set. */
  fieldDataTupleId?: number;
  /** Controls the use of a texture map for point-scalar interpolation. */
  interpolateScalarsBeforeMapping?: boolean;
  /** Specifies the source of the scalar data. */
  scalarMode?: number;
  /** Specifies the scalar range that the mapper uses. */
  scalarRange?: Range;
  /** Controls scalar coloring. */
  scalarVisibility?: boolean;
  /** Controls the use of the scalar range from the lookup table. */
  useLookupTableScalarRange?: boolean;
}

/** Contains the selected scalar array and its data association. */
export interface IAbstractScalars {
  /** True if the scalar array contains cell data. */
  cellFlag: boolean;
  /** The selected scalar array, or null if no array is available. */
  scalars: Nullable<vtkDataArray>;
}

/**
 * Provides the scalar coloring methods that a mapper can install.
 *
 * `vtkMapper` and `vtkMapper2D` use these methods.
 */
export interface IScalarColoring {
  /**
   * Test if the mapper can use a texture map for the specified scalar array.
   *
   * A true result does not enable scalar coloring.
   *
   * @param scalars - The scalar array to test.
   * @param cellFlag - True if `scalars` contains cell data.
   * @returns True if the mapper can use a texture map.
   */
  canUseTextureMapForColoring(
    scalars: vtkDataArray,
    cellFlag: boolean
  ): boolean;

  /**
   * Clear the generated color arrays.
   *
   * The mapper creates the arrays again during the next call to `mapScalars`.
   * Use this method when a multiblock data set changes its scalar arrays.
   */
  clearColorArrays(): void;

  /**
   * Create a default lookup table.
   *
   * Use this method when the scalar data does not supply a lookup table.
   */
  createDefaultLookupTable(): void;

  /**
   * Select a scalar array from the input data.
   *
   * @param input - The input data set.
   * @param scalarMode - The data association from which to select scalars.
   * @param arrayAccessMode - The method that selects the array.
   * @param arrayId - The array identifier to use in identifier mode.
   * @param arrayName - The array name to use in name mode.
   * @returns The selected array and its data association.
   */
  getAbstractScalars(
    input: any,
    scalarMode: ScalarMode,
    arrayAccessMode: number,
    arrayId: any,
    arrayName: any
  ): IAbstractScalars;

  /**
   * Return true if the last scalar mapping operation used cell data.
   *
   * Cell data produces one color coordinate for each cell. Point data produces
   * one color coordinate for each point.
   */
  getAreScalarsMappedFromCells(): boolean;

  /**
   * Return the method that selects an array by name or by identifier.
   */
  getArrayAccessMode(): number;

  /**
   * Return the name of the array that supplies the scalar values.
   */
  getColorByArrayName(): Nullable<string>;

  /**
   * Return the generated texture coordinates, or null if none exist.
   */
  getColorCoordinates(): Nullable<Float32Array>;

  /**
   * Return the generated vertex colors, or null if none exist.
   */
  getColorMapColors(): Nullable<Uint8Array>;

  /**
   * Return the method that converts scalar values to colors.
   */
  getColorMode(): ColorMode;

  /**
   * Return the name of the current color mode.
   */
  getColorModeAsString(): string;

  /**
   * Return the generated color texture, or null if none exists.
   */
  getColorTextureMap(): any;

  /**
   * Return the field-data tuple that colors the data set.
   *
   * @default -1
   */
  getFieldDataTupleId(): any;

  /**
   * Return true if the mapper maps point scalars before interpolation.
   *
   * If false, the mapper interpolates vertex colors. If true, the mapper
   * interpolates scalar values and gets colors from a texture map.
   *
   * @default false
   */
  getInterpolateScalarsBeforeMapping(): boolean;

  /**
   * Return the lookup table. Create a default table if no table exists.
   */
  getLookupTable(): any;

  /**
   * Return the number of colors that map values in the scalar range.
   */
  getNumberOfColorsInRange(): number;

  /**
   * Return the method that selects the source of the scalar data.
   */
  getScalarMode(): number;

  /**
   * Return the name of the current scalar mode.
   */
  getScalarModeAsString(): string;

  /**
   * Return a copy of the scalar range.
   *
   * @default [0, 1]
   */
  getScalarRange(): number[];

  /**
   * Return a reference to the scalar range.
   *
   * @default [0, 1]
   */
  getScalarRangeByReference(): number[];

  /**
   * Return true if the mapper uses scalar data to color objects.
   *
   * @default true
   */
  getScalarVisibility(): boolean;

  /**
   * Return true if the mapper uses the scalar range from the lookup table.
   *
   * @default false
   */
  getUseLookupTableScalarRange(): boolean;

  /**
   * Map the input scalars to colors or to texture coordinates.
   *
   * The method does not map scalars if scalar visibility is off. The method
   * also does not map scalars if the input does not contain a selected array.
   *
   * @param input - The input data set.
   * @param alpha - The opacity to apply to the mapped colors.
   */
  mapScalars(input: any, alpha: number): void;

  /**
   * Set the method that selects an array by name or by identifier.
   *
   * @param arrayAccessMode - The array access mode to use.
   * @returns True if the value changed.
   */
  setArrayAccessMode(arrayAccessMode: number): boolean;

  /**
   * Set the name of the array that supplies the scalar values.
   *
   * @param colorByArrayName - The array name to use.
   * @returns True if the value changed.
   */
  setColorByArrayName(colorByArrayName: string): boolean;

  /**
   * Set the method that converts scalar values to colors.
   *
   * @param colorMode - The color mode to use.
   * @returns True if the value changed.
   */
  setColorMode(colorMode: number): boolean;

  /**
   * Set the color mode to `DEFAULT`.
   */
  setColorModeToDefault(): boolean;

  /**
   * Set the color mode to `MAP_SCALARS`.
   */
  setColorModeToMapScalars(): boolean;

  /**
   * Set the color mode to `DIRECT_SCALARS`.
   */
  setColorModeToDirectScalars(): boolean;

  /**
   * Set the field-data tuple that colors the complete data set.
   *
   * This value applies when the scalar mode is `USE_FIELD_DATA`. A value of
   * -1 maps each value in the selected array to one cell. A nonnegative value
   * uses one tuple to color the complete data set.
   *
   * @param fieldDataTupleId - The tuple identifier to use.
   * @returns True if the value changed.
   * @default -1
   */
  setFieldDataTupleId(fieldDataTupleId: number): boolean;

  /**
   * Control the mapping of point scalars before interpolation.
   *
   * If false, the mapper interpolates vertex colors. If true, the mapper
   * interpolates scalar values and gets colors from a texture map.
   *
   * @param interpolateScalarsBeforeMapping - The new control value.
   * @returns True if the value changed.
   */
  setInterpolateScalarsBeforeMapping(
    interpolateScalarsBeforeMapping: boolean
  ): boolean;

  /**
   * Set the lookup table that converts scalar values to colors.
   *
   * @param lookupTable - The lookup table to use.
   * @returns True if the value changed.
   */
  setLookupTable(lookupTable: any): boolean;

  /**
   * Set the source of the scalar data.
   *
   * `DEFAULT` first uses point scalars. It uses cell scalars if point scalars
   * are not available. The other modes select point data, cell data, point
   * field data, cell field data, or field data.
   *
   * Select an array before you use a field-data mode.
   *
   * @param scalarMode - The scalar mode to use.
   * @returns True if the value changed.
   */
  setScalarMode(scalarMode: number): boolean;

  /**
   * Set the scalar mode to `DEFAULT`.
   */
  setScalarModeToDefault(): boolean;

  /**
   * Set the scalar mode to `USE_CELL_DATA`.
   */
  setScalarModeToUseCellData(): boolean;

  /**
   * Set the scalar mode to `USE_CELL_FIELD_DATA`.
   */
  setScalarModeToUseCellFieldData(): boolean;

  /**
   * Set the scalar mode to `USE_FIELD_DATA`.
   */
  setScalarModeToUseFieldData(): boolean;

  /**
   * Set the scalar mode to `USE_POINT_DATA`.
   */
  setScalarModeToUsePointData(): boolean;

  /**
   * Set the scalar mode to `USE_POINT_FIELD_DATA`.
   */
  setScalarModeToUsePointFieldData(): boolean;

  /**
   * Set the minimum and maximum scalar values that map through the lookup table.
   *
   * The mapper ignores this range if `useLookupTableScalarRange` is true.
   *
   * @param min - The minimum scalar value.
   * @param max - The maximum scalar value.
   * @returns True if a value changed.
   * @default [0, 1]
   */
  setScalarRange(min: number, max: number): boolean;

  /**
   * Set the scalar range that maps through the lookup table.
   *
   * The mapper ignores this range if `useLookupTableScalarRange` is true.
   *
   * @param scalarRange - The minimum and maximum scalar values.
   * @returns True if a value changed.
   * @default [0, 1]
   */
  setScalarRange(scalarRange: number[]): boolean;

  /**
   * Copy a scalar range to the mapper.
   *
   * @param scalarRange - The minimum and maximum scalar values.
   * @returns True if a value changed.
   * @default [0, 1]
   */
  setScalarRangeFrom(scalarRange: number[]): boolean;

  /**
   * Control the use of scalar data to color objects.
   *
   * @param scalarVisibility - The new control value.
   * @returns True if the value changed.
   * @default true
   */
  setScalarVisibility(scalarVisibility: boolean): boolean;

  /**
   * Control the source of the scalar range.
   *
   * If false, the mapper applies its scalar range to the lookup table. If true,
   * the mapper uses the scalar range that the lookup table contains. Set this
   * value to true when multiple mappers share one lookup table.
   *
   * @param useLookupTableScalarRange - The new control value.
   * @returns True if the value changed.
   * @default false
   */
  setUseLookupTableScalarRange(useLookupTableScalarRange: boolean): boolean;
}

/**
 * Defines a scalar coloring interface without the specified methods.
 */
export type TScalarColoringWithout<
  TExcludedMethods extends keyof IScalarColoring,
> = Omit<IScalarColoring, TExcludedMethods>;

/**
 * Install scalar coloring methods and default values on a mapper.
 *
 * The function keeps values that are already in `model`. It copies array
 * defaults so that mapper instances do not share the arrays.
 *
 * @param publicAPI - The public object that receives the methods.
 * @param model - The internal object that receives the data.
 */
export function implementScalarColoringMethods(
  publicAPI: object,
  model: object
): void;

/**
 * Provides scalar coloring functions and default values.
 */
export interface vtkScalarColoringHelper {
  /**
   * Install scalar coloring methods and default values on a mapper.
   */
  implementScalarColoringMethods: typeof implementScalarColoringMethods;
  /** The default initial values for scalar coloring. */
  DEFAULT_VALUES: IScalarColoringInitialValues;
  /**
   * Create texture coordinates for a scalar array, or return cached coordinates.
   *
   * A negative component selects the vector magnitude. A component that is not
   * in the input array also selects the vector magnitude. If logarithmic scale
   * is enabled, `range` must contain logarithmic values.
   *
   * @param input - The scalar array to map.
   * @param component - The scalar component to map.
   * @param range - The scalar range to map.
   * @param useLogScale - True to apply a base-10 logarithm to scalar values.
   * @param numberOfColorsInRange - The number of colors in `range`.
   * @param dimensions - The texture dimensions.
   * @param useZigzagPattern - True to put consecutive colors in a zigzag path.
   * @returns A data array that contains two-dimensional or three-dimensional
   * texture coordinates.
   */
  getOrCreateColorTextureCoordinates(
    input: vtkDataArray,
    component: number,
    range: Range,
    useLogScale: boolean,
    numberOfColorsInRange: number,
    dimensions: [number, number, number],
    useZigzagPattern: boolean
  ): vtkDataArray;
}

/**
 * Provides scalar coloring functions and default values.
 */
declare const ScalarColoringHelper: vtkScalarColoringHelper;
export default ScalarColoringHelper;
