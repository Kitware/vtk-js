import { vtkObject } from "../../../interfaces";
import { ColorMode } from "../../../Rendering/Core/Mapper/Constants";
import { Range } from "../../../types";
import { ScalarMappingTarget, VectorMode } from "./Constants";

/**
 *
 */
export interface IScalarsToColorsInitialValues {
	alpha?: number;
	vectorComponent?: number;
	vectorSize?: number;
	indexedLookup?: boolean;
}

export interface vtkScalarsToColors extends vtkObject {

	/**
	 * Perform any processing required (if any) before processing scalars.
	 */
	build(): void;

	/**
	 * 
	 * @param value 
	 */
	checkForAnnotatedValue(value: any): number;

	/**
	 * 
	 * @param colors 
	 * @param numComp 
	 * @param numTuples 
	 */
	convertToRGBA(colors: any, numComp: number, numTuples: number): void;

	/**
	 * Specify an additional opacity (alpha) value to blend with.
	 */
	getAlpha(): number;

	/**
	 * 
	 * @param {Number} idx 
	 */
	getAnnotatedValue(idx: number): void;

	/**
	 * 
	 * @param val 
	 */
	getAnnotatedValueIndex(val: any): number;

	/**
	 * An unsafe version of vtkScalarsToColors.checkForAnnotatedValue for
	 * internal use (no pointer checks performed)
	 * @param value 
	 */
	getAnnotatedValueIndexInternal(value: any): number;

	/**
	 * 
	 * @param {Number} idx 
	 */
	getAnnotation(idx: number): string;

	/**
	 * 
	 * @param val 
	 * @param rgba 
	 */
	getAnnotationColor(val: any, rgba: any): void;

	/**
	 * 
	 * @param val 
	 * @param rgba 
	 */
	getIndexedColor(val: number, rgba: any): void;

	/**
	 * 
	 */
	getIndexedLookup(): boolean;

	/**
	 * 
	 */
	getMappingRange(): Range;

	/**
	 * 
	 */
	getMappingRangeByReference(): Range;

	/**
	 * Return the annotated value at a particular index in the list of annotations.
	 */
	getNumberOfAnnotatedValues(): number;

	/**
	 * Get the number of available colors for mapping to.
	 */
	getNumberOfAvailableColors(): number;

	/**
	 * 
	 * @param {Number} min 
	 * @param {Number} max 
	 */
	getRange(min: number, max: number): Range;

	/**
	 * Get which component of a vector to map to colors.
	 */
	getVectorComponent(): number;

	/**
	 * 
	 */
	getVectorMode(): VectorMode;

	/**
	 * 
	 */
	getVectorSize(): number;

	/**
	 * 
	 */
	isOpaque(): boolean;

	/**
	 * 
	 * @param newColors 
	 * @param colors 
	 * @param {Number} alpha 
	 * @param convtFun 
	 */
	luminanceAlphaToRGBA(newColors: any, colors: any, alpha: number, convtFun: any): void;

	/**
	 * 
	 * @param newColors 
	 * @param colors 
	 * @param {Number} alpha 
	 * @param convtFun 
	 */
	luminanceToRGBA(newColors: any, colors: any, alpha: number, convtFun: any): void;

	/**
	 * Internal methods that map a data array into a 4-component, unsigned char
	 * RGBA array. The color mode determines the behavior of mapping. If
	 * ColorMode.DEFAULT is set, then unsigned char data arrays are treated as
	 * colors (and converted to RGBA if necessary); If ColorMode.DIRECT_SCALARS
	 * is set, then all arrays are treated as colors (integer types are clamped
	 * in the range 0-255, floating point arrays are clamped in the range
	 * 0.0-1.0. Note 'char' does not have enough values to represent a color so
	 * mapping this type is considered an error); otherwise, the data is mapped
	 * through this instance of ScalarsToColors. The component argument is used
	 * for data arrays with more than one component; it indicates which
	 * component to use to do the blending.  When the component argument is -1,
	 * then the this object uses its own selected technique to change a vector
	 * into a scalar to map.
	 * @param scalars 
	 * @param {ColorMode} colorMode 
	 * @param {Number} componentIn 
	 */
	mapScalars(scalars: any, colorMode: ColorMode, componentIn: number): void;

	/**
	 * Map a set of vector values through the table
	 * @param input 
	 * @param output 
	 * @param {ScalarMappingTarget} outputFormat 
	 * @param vectorComponentIn 
	 * @param {Number} vectorSizeIn 
	 */
	mapVectorsThroughTable(input: any, output: any, outputFormat: ScalarMappingTarget, vectorComponentIn: number, vectorSizeIn: number): void;

	/**
	 * 
	 * @param input 
	 * @param output 
	 * @param {Number} compsToUse 
	 */
	mapVectorsToMagnitude(input: any, output: any, compsToUse: number): void;

	/**
	 * 
	 * @param newColors 
	 * @param colors 
	 * @param {Number} alpha 
	 * @param convtFun 
	 */
	rGBAToRGBA(newColors: any, colors: any, alpha: number, convtFun: any): void;

	/**
	 * 
	 * @param newColors 
	 * @param colors 
	 * @param {Number} alpha 
	 * @param convtFun 
	 */
	rGBToRGBA(newColors: any, colors: any, alpha: number, convtFun: any): void;

	/**
	 * Remove an existing entry from the list of annotated values.
	 * @param value 
	 */
	removeAnnotation(value: any): boolean;

	/**
	 * Remove all existing values and their annotations.
	 */
	resetAnnotations(): void;

	/**
	 * 
	 * @param {Number} alpha 
	 */
	setAlpha(alpha: number): boolean;

	/**
	 * 
	 * @param value 
	 * @param annotation 
	 */
	setAnnotation(value: any, annotation: any): number;

	/**
	 * 
	 * @param values 
	 * @param annotations 
	 */
	setAnnotations(values: any, annotations: any): void;

	/**
	 * 
	 * @param {Boolean} indexedLookup 
	 */
	setIndexedLookup(indexedLookup: boolean): boolean;

	/**
	 * 
	 * @param {Range} mappingRange 
	 */
	setMappingRange(mappingRange: Range): boolean;

	/**
	 * 
	 * @param {Number} min 
	 * @param {Number} max 
	 */
	setMappingRange(min: number, max: number): boolean;

	/**
	 * 
	 * @param {Range} mappingRange 
	 */
	setMappingRangeFrom(mappingRange: Range): boolean;

	/**
	 * 
	 * @param {Number} min 
	 * @param {Number} max 
	 */
	setRange(min: number, max: number): boolean;

	/**
	 * If the mapper does not select which component of a vector to map to
	 * colors, you can specify it here.
	 * @param {Number} vectorComponent The value of the vector mode.
	 */
	setVectorComponent(vectorComponent: number): boolean;

	/**
	 * Change mode that maps vectors by magnitude vs. component. If the mode is
	 * "RGBColors", then the vectors components are scaled to the range and
	 * passed directly as the colors.
	 * @param {VectorMode} vectorMode The value of the vector mode.
	 */
	setVectorMode(vectorMode: VectorMode): boolean;

	/**
	 * Set vectorMode to `VectorMode.MAGNITUDE`
	 */
	setVectorModeToMagnitude(): boolean;

	/**
	 * Set vectorMode to `VectorMode.COMPONENT`
	 */
	setVectorModeToComponent(): boolean;

	/**
	 * When mapping vectors, consider only the number of components selected by
	 * `vectorSize` to be part of the vector, and ignore any other components. Set
	 * to -1 to map all components. If this is not set to -1, then you can use
	 * `setVectorComponent` to set which scalar component will be the first
	 * component in the vector to be mapped.
	 */
	setVectorModeToRGBColors(): boolean;

	/**
	 * When mapping vectors, consider only the number of components selected by
	 * VectorSize to be part of the vector, and ignore any other components.
	 * @param {Number} vectorSize The value of the vectorSize.
	 */
	setVectorSize(vectorSize: number): boolean;

	/**
	 * Update the map from annotated values to indices in the array of annotations.
	 */
	updateAnnotatedValueMap(): boolean;

	/**
	 * 
	 */
	usingLogScale(): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkScalarsToColors characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IScalarsToColorsInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IScalarsToColorsInitialValues): void;

/**
 * Method used to create a new instance of vtkScalarsToColors
 * @param {IScalarsToColorsInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IScalarsToColorsInitialValues): vtkScalarsToColors;

/**
 * vtkScalarsToColors is a general-purpose base class for objects that convert
 * scalars to colors. This include vtkLookupTable classes and color transfer
 * functions. By itself, this class will simply rescale the scalars.
 *
 * The scalar-to-color mapping can be augmented with an additional uniform alpha
 * blend. This is used, for example, to blend a vtkActor's opacity with the
 * lookup table values.
 *
 * Specific scalar values may be annotated with text strings that will be
 * included in color legends using `setAnnotations`, `setAnnotation`,
 * `getNumberOfAnnotatedValues`, `getAnnotatedValue`, `getAnnotation`,
 * `removeAnnotation`, and `resetAnnotations`.
 *
 * This class also has a method for indicating that the set of annotated values
 * form a categorical color map; by setting IndexedLookup to true, you indicate
 * that the annotated values are the only valid values for which entries in the
 * color table should be returned. In this mode, subclasses should then assign
 * colors to annotated values by taking the modulus of an annotated value's
 * index in the list of annotations with the number of colors in the table.
 */
export declare const vtkScalarsToColors: {
	newInstance: typeof newInstance;
	extend: typeof extend;
	VectorMode: typeof VectorMode;
	ScalarMappingTarget: typeof VectorMode;
}
export default vtkScalarsToColors;
