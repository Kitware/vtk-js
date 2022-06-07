import { Range, RGBAColor } from "../../../types";
import vtkScalarsToColors from "../ScalarsToColors";

/**
 * 
 */
export interface ILookupTableInitialValues {
}

export interface vtkLookupTable extends vtkScalarsToColors {

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
	lookupShiftAndScale(range: Range, p: object): boolean

	/**
	 * 
	 * @param aboveRangeColor 
	 */
	setAboveRangeColor(aboveRangeColor: RGBAColor): boolean;

	/**
	 * 
	 * @param aboveRangeColor 
	 */
	setAboveRangeColorFrom(aboveRangeColor: RGBAColor): boolean;

	/**
	 * 
	 * @param alphaRange 
	 */
	setAlphaRange(alphaRange: Range): boolean;

	/**
	 * 
	 * @param alphaRange 
	 */
	setAlphaRangeFrom(alphaRange: Range): boolean;

	/**
	 * 
	 * @param belowRangeColor 
	 */
	setBelowRangeColor(belowRangeColor: RGBAColor): boolean;

	/**
	 * 
	 * @param belowRangeColor 
	 */
	setBelowRangeColorFrom(belowRangeColor: RGBAColor): boolean;

	/**
	 * 
	 * @param hueRange 
	 */
	setHueRange(hueRange: Range): boolean;

	/**
	 * 
	 * @param hueRange 
	 */
	setHueRangeFrom(hueRange: Range): boolean;

	/**
	 * 
	 * @param nanColor 
	 */
	setNanColor(nanColor: RGBAColor): boolean;

	/**
	 * 
	 * @param nanColor 
	 */
	setNanColorFrom(nanColor: RGBAColor): boolean;

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
	setSaturationRangeFrom(saturationRange: Range): boolean;

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
	setValueRangeFrom(valueRange: Range): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkLookupTable characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ILookupTableInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ILookupTableInitialValues): void;

/**
 * Method used to create a new instance of vtkLookupTable
 * @param {ILookupTableInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: ILookupTableInitialValues): vtkLookupTable;


/**
 * vtkLookupTable is a 2D widget for manipulating a marker prop
 */
export declare const vtkLookupTable: {
	newInstance: typeof newInstance;
	extend: typeof extend;
}
export default vtkLookupTable;
