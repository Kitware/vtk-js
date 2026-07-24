import { Nullable, Range } from '../../../types';
import { vtkDataArray } from '../../../Common/Core/DataArray';
import { ColorMode, ScalarMode } from './Constants';

/**
 * Coloring defaults shared by every mapper that installs the scalar coloring
 * methods. A consuming mapper may override any of these in its own
 * initialValues (e.g. vtkMapper2D disables scalarVisibility by default).
 */
export interface IScalarColoringInitialValues {
  arrayAccessMode?: number;
  colorByArrayName?: Nullable<string>;
  colorMode?: number;
  fieldDataTupleId?: number;
  interpolateScalarsBeforeMapping?: boolean;
  scalarMode?: number;
  scalarRange?: Range;
  scalarVisibility?: boolean;
  useLookupTableScalarRange?: boolean;
}

export interface IAbstractScalars {
  cellFlag: boolean;
  scalars: Nullable<vtkDataArray>;
}

/**
 * Scalar coloring surface installed on a mapper by
 * implementScalarColoringMethods. Shared by vtkMapper and vtkMapper2D.
 */
export interface IScalarColoring {
  /**
   * Returns if we can use texture maps for scalar coloring. Note this doesn’t
   * say we “will” use scalar coloring. It says, if we do use scalar coloring,
   * we will use a texture.
   * When rendering multiblock datasets, if any 2 blocks provide different
   * lookup tables for the scalars, then also we cannot use textures. This case
   * can be handled if required.
   * @param scalars
   * @param cellFlag True when the scalars are per cell instead of per point
   */
  canUseTextureMapForColoring(
    scalars: vtkDataArray,
    cellFlag: boolean
  ): boolean;

  /**
   * Call to force a rebuild of color result arrays on next MapScalars.
   * Necessary when using arrays in the case of multiblock data.
   */
  clearColorArrays(): void;

  /**
   * Create default lookup table. Generally used to create one when
   * none is available with the scalar data.
   */
  createDefaultLookupTable(): void;

  /**
   *
   * @param input
   * @param {ScalarMode} scalarMode
   * @param arrayAccessMode
   * @param arrayId
   * @param arrayName
   */
  getAbstractScalars(
    input: any,
    scalarMode: ScalarMode,
    arrayAccessMode: number,
    arrayId: any,
    arrayName: any
  ): IAbstractScalars;

  /**
   * When scalars are mapped from cells,
   * there is one color coordinate per cell instead of one per point
   * in the vtkDataArray getColorCoordinates().
   */
  getAreScalarsMappedFromCells(): boolean;

  /**
   *
   */
  getArrayAccessMode(): number;

  /**
   * Get the array name to color by.
   */
  getColorByArrayName(): Nullable<string>;

  /**
   * Provide read access to the color texture coordinate array
   */
  getColorCoordinates(): Nullable<Float32Array>;

  /**
   * Provide read access to the color array.
   */
  getColorMapColors(): Nullable<Uint8Array>;

  /**
   * Return the method of coloring scalar data.
   */
  getColorMode(): ColorMode;

  /**
   * Return the method of coloring scalar data.
   */
  getColorModeAsString(): string;

  /**
   * Provide read access to the color texture array
   */
  getColorTextureMap(): any;

  /**
   *
   * @default -1
   */
  getFieldDataTupleId(): any;

  /**
   * By default, vertex color is used to map colors to a surface.
   * Colors are interpolated after being mapped.
   * This option avoids color interpolation by using a one dimensional
   * texture map for the colors.
   * @default false
   */
  getInterpolateScalarsBeforeMapping(): boolean;

  /**
   * Get a lookup table for the mapper to use.
   */
  getLookupTable(): any;

  /**
   * The number of mapped colors in range
   */
  getNumberOfColorsInRange(): number;

  /**
   * Return the method for obtaining scalar data.
   */
  getScalarMode(): number;

  /**
   * Return the method for obtaining scalar data.
   */
  getScalarModeAsString(): string;

  /**
   *
   * @default [0, 1]
   */
  getScalarRange(): number[];

  /**
   *
   * @default [0, 1]
   */
  getScalarRangeByReference(): number[];

  /**
   * Check whether scalar data is used to color objects.
   * @default true
   */
  getScalarVisibility(): boolean;

  /**
   *
   * @default false
   */
  getUseLookupTableScalarRange(): boolean;

  /**
   * Map the scalars (if there are any scalars and ScalarVisibility is on)
   * through the lookup table, returning an unsigned char RGBA array. This is
   * typically done as part of the rendering process. The alpha parameter
   * allows the blending of the scalars with an additional alpha (typically
   * which comes from a vtkActor, etc.)
   * @param input
   * @param {Number} alpha
   */
  mapScalars(input: any, alpha: number): void;

  /**
   *
   * @param {Number} arrayAccessMode
   */
  setArrayAccessMode(arrayAccessMode: number): boolean;

  /**
   * Set the array name to color by.
   * @param {String} colorByArrayName
   */
  setColorByArrayName(colorByArrayName: string): boolean;

  /**
   *
   * @param {Number} colorMode
   */
  setColorMode(colorMode: number): boolean;

  /**
   * Sets colorMode to `DEFAULT`
   */
  setColorModeToDefault(): boolean;

  /**
   * Sets colorMode to `MAP_SCALARS`
   */
  setColorModeToMapScalars(): boolean;

  /**
   * Sets colorMode to `DIRECT_SCALARS`
   */
  setColorModeToDirectScalars(): boolean;

  /**
   * When ScalarMode is set to UseFieldData, set the index of the
   * tuple by which to color the entire data set. By default, the
   * index is -1, which means to treat the field data array selected
   * with SelectColorArray as having a scalar value for each cell.
   * Indices of 0 or higher mean to use the tuple at the given index
   * for coloring the entire data set.
   * @param {Number} fieldDataTupleId
   * @default -1
   */
  setFieldDataTupleId(fieldDataTupleId: number): boolean;

  /**
   *
   */
  setInterpolateScalarsBeforeMapping(
    interpolateScalarsBeforeMapping: boolean
  ): boolean;

  /**
   * Set a lookup table for the mapper to use.
   */
  setLookupTable(lookupTable: any): boolean;

  /**
   * Control how the filter works with scalar point data and cell attribute
   * data. By default (ScalarModeToDefault), the filter will use point data,
   * and if no point data is available, then cell data is used. Alternatively
   * you can explicitly set the filter to use point data
   * (ScalarModeToUsePointData) or cell data (ScalarModeToUseCellData).
   * You can also choose to get the scalars from an array in point field
   * data (ScalarModeToUsePointFieldData) or cell field data
   * (ScalarModeToUseCellFieldData). If scalars are coming from a field
   * data array, you must call SelectColorArray before you call GetColors.
   *
   * @param scalarMode
   */
  setScalarMode(scalarMode: number): boolean;

  /**
   * Sets scalarMode to DEFAULT
   */
  setScalarModeToDefault(): boolean;

  /**
   * Sets scalarMode to USE_CELL_DATA
   */
  setScalarModeToUseCellData(): boolean;

  /**
   * Sets scalarMode to USE_CELL_FIELD_DATA
   */
  setScalarModeToUseCellFieldData(): boolean;

  /**
   * Sets scalarMode to USE_FIELD_DATA
   */
  setScalarModeToUseFieldData(): boolean;

  /**
   * Sets scalarMode to USE_POINT_DATA
   */
  setScalarModeToUsePointData(): boolean;

  /**
   * Sets scalarMode to USE_POINT_FIELD_DATA
   */
  setScalarModeToUsePointFieldData(): boolean;

  /**
   * Specify range in terms of scalar minimum and maximum (smin,smax). These
   * values are used to map scalars into lookup table. Has no effect when
   * UseLookupTableScalarRange is true.
   *
   * @param min
   * @param max
   * @default [0, 1]
   */
  setScalarRange(min: number, max: number): boolean;

  /**
   * Specify range in terms of scalar minimum and maximum (smin,smax). These
   * values are used to map scalars into lookup table. Has no effect when
   * UseLookupTableScalarRange is true.
   *
   * @param scalarRange
   * @default [0, 1]
   */
  setScalarRange(scalarRange: number[]): boolean;

  /**
   *
   * @param scalarRange
   * @default [0, 1]
   */
  setScalarRangeFrom(scalarRange: number[]): boolean;

  /**
   * Turn on/off flag to control whether scalar data is used to color objects.
   * @param {Boolean} scalarVisibility
   * @default true
   */
  setScalarVisibility(scalarVisibility: boolean): boolean;

  /**
   * Control whether the mapper sets the lookuptable range based on its
   * own ScalarRange, or whether it will use the LookupTable ScalarRange
   * regardless of it’s own setting. By default the Mapper is allowed to set
   * the LookupTable range, but users who are sharing LookupTables between
   * mappers/actors will probably wish to force the mapper to use the
   * LookupTable unchanged.
   *
   * @param {Boolean} useLookupTableScalarRange
   * @default false
   */
  setUseLookupTableScalarRange(useLookupTableScalarRange: boolean): boolean;
}

export type TScalarColoringWithout<
  TExcludedMethods extends keyof IScalarColoring,
> = Omit<IScalarColoring, TExcludedMethods>;

/**
 * Decorate a mapper (publicAPI+model) with the scalar coloring methods and
 * seed the coloring defaults. Values already present on the model (from the
 * consuming mapper's own defaults or initialValues) are preserved.
 *
 * @param publicAPI object on which methods will be bound (public)
 * @param model object on which data structure will be bound (protected)
 */
export function implementScalarColoringMethods(
  publicAPI: object,
  model: object
): void;

export interface vtkScalarColoringHelper {
  implementScalarColoringMethods: typeof implementScalarColoringMethods;
  DEFAULT_VALUES: IScalarColoringInitialValues;
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

declare const ScalarColoringHelper: vtkScalarColoringHelper;
export default ScalarColoringHelper;
