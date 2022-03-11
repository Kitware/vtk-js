import { Nullable } from "../../../types";
import vtkAbstractMapper, { IAbstractMapperInitialValues } from "../AbstractMapper";

export enum ColorMode {
	DEFAULT,
	MAP_SCALARS,
	DIRECT_SCALARS,
}

export enum ScalarMode {
	DEFAULT,
	USE_POINT_DATA,
	USE_CELL_DATA,
	USE_POINT_FIELD_DATA,
	USE_CELL_FIELD_DATA,
	USE_FIELD_DATA,
}

export enum GetArray {
	BY_ID,
	BY_NAME,
}

interface IPrimitiveCount {
	points: number;
	verts: number;
	lines: number;
	triangles: number;
}

interface IAbstractScalars {
	cellFlag: boolean;
}

interface IScalarToTextureCoordinate {
	texCoordS: number;
	texCoordT: number;
}

export interface IMapper2DInitialValues extends IAbstractMapperInitialValues{
	arrayAccessMode?: number;
	colorMode?: number;
	customShaderAttributes?: any;
	renderTime?: number;
	scalarMode?: number;
	scalarRange?: Range;
	scalarVisibility?: boolean;
	static?: boolean;
}

export interface vtkMapper2D extends vtkAbstractMapper {
	
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
	getAbstractScalars(input: any, scalarMode: ScalarMode, arrayAccessMode: number, arrayId: any, arrayName: any): IAbstractScalars;

	/**
	 *
	 */
	getArrayAccessMode(): number;

	/**
	 * Get the array name to color by.
	 */
	getColorByArrayName(): Nullable<string>;

	/**
	 * Provide read access to the color array.
	 */
	getColorMapColors(): Nullable<Uint8Array>;

	/**
	 * Return the method of coloring scalar data.
	 */
	getColorMode(): number;

	/**
	 * Return the method of coloring scalar data.
	 */
	getColorModeAsString(): string;

	/**
	 *
	 * @default []
	 */
	getCustomShaderAttributes(): any

	/**
	 * Get a lookup table for the mapper to use.
	 */
	getLookupTable(): any;

	/**
	 * Get the transformCoordinate.
	 */
	getTransformCoordinate(): any;

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
	 * Check whether the mapper’s data is static.
	 * @default false
	 */
	getStatic(): boolean;

	/**
	 *
	 * @default false
	 */
	getUseLookupTableScalarRange(): boolean;

	/**
	 *
	 * @default null
	 */
	getViewSpecificProperties(): object;

	/**
	 * Map the scalars (if there are any scalars and ScalarVisibility is on)
	 * through the lookup table, returning an unsigned char RGBA array. This is
	 * typically done as part of the rendering process. The alpha parameter
	 * allows the blending of the scalars with an additional alpha (typically
	 * which comes from a vtkActor, etc.)
	 * {
	 *     rgba: Uint8Array(),
	 *     location: 0/1/2, // Points/Cells/Fields
	 * }
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
	 * Sets point data array names that will be transferred to the VBO
	 * @param {String[]} customShaderAttributes 
	 */
	setCustomShaderAttributes(customShaderAttributes: string[]): boolean

	/**
	 * Set a lookup table for the mapper to use.
	 */
	setLookupTable(lookupTable: any): boolean;

	/**
	 * Set the transformCoordinate.
	 */
	setTransformCoordinate(coordinate: any): boolean;

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
	 * When ScalarMode is set to use Field Data (ScalarModeToFieldData),
	 * you must call SelectColorArray to choose the field data array to
	 * be used to color cells. In this mode, the default behavior is to
	 * treat the field data tuples as being associated with cells. If
	 * the poly data contains triangle strips, the array is expected to
	 * contain the cell data for each mini-cell formed by any triangle
	 * strips in the poly data as opposed to treating them as a single
	 * tuple that applies to the entire strip. This mode can also be
	 * used to color the entire poly data by a single color obtained by
	 * mapping the tuple at a given index in the field data array
	 * through the color map. Use SetFieldDataTupleId() to specify
	 * the tuple index.
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
	 * Turn on/off flag to control whether the mapper’s data is static. Static data
	 * means that the mapper does not propagate updates down the pipeline, greatly
	 * decreasing the time it takes to update many mappers. This should only be
	 * used if the data never changes.
	 *
	 * @param {Boolean} static
	 * @default false
	 */
	setStatic(static: boolean): boolean;

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

	/**
	 * If you want to provide specific properties for rendering engines you can use
	 * viewSpecificProperties.
	 *
	 * You can go and have a look in the rendering backend of your choice for details
	 * on specific properties.
	 * For example, for OpenGL/WebGL see OpenGL/PolyDataMapper/api.md
	 * If there is no details, viewSpecificProperties is not supported.
	 * @param viewSpecificProperties
	 */
	setViewSpecificProperties(viewSpecificProperties: object): boolean;

}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkMapper2D characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IMapper2DInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IMapper2DInitialValues): void;

/**
 * Method used to create a new instance of vtkMapper2D
 * @param {IMapper2DInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IMapper2DInitialValues): vtkMapper2D;

/**
 * vtkMapper2D is an abstract class to specify interface between data and
 * graphics primitives. Subclasses of vtkMapper map data through a
 * lookuptable and control the creation of rendering primitives that
 * interface to the graphics library. The mapping can be controlled by
 * supplying a lookup table and specifying a scalar range to map data
 * through.
 *
 * There are several important control mechanisms affecting the behavior of
 * this object. The ScalarVisibility flag controls whether scalar data (if
 * any) controls the color of the associated actor(s) that refer to the
 * mapper. The ScalarMode ivar is used to determine whether scalar point data
 * or cell data is used to color the object. By default, point data scalars
 * are used unless there are none, then cell scalars are used. Or you can
 * explicitly control whether to use point or cell scalar data. Finally, the
 * mapping of scalars through the lookup table varies depending on the
 * setting of the ColorMode flag. See the documentation for the appropriate
 * methods for an explanation.
 *
 * Another important feature of this class is whether to use immediate mode
 * rendering (ImmediateModeRenderingOn) or display list rendering
 * (ImmediateModeRenderingOff). If display lists are used, a data structure
 * is constructed (generally in the rendering library) which can then be
 * rapidly traversed and rendered by the rendering library. The disadvantage
 * of display lists is that they require additional memory which may affect
 * the performance of the system.
 *
 * Another important feature of the mapper is the ability to shift the
 * Z-buffer to resolve coincident topology. For example, if you’d like to
 * draw a mesh with some edges a different color, and the edges lie on the
 * mesh, this feature can be useful to get nice looking lines. (See the
 * ResolveCoincidentTopology-related methods.)
 */
export declare const vtkMapper2D: {
	newInstance: typeof newInstance;
	extend: typeof extend;
}
export default vtkMapper2D;
