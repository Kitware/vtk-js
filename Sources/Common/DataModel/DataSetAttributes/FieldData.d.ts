import { vtkObject } from "../../../interfaces" ;
import { Nullable } from "../../../types";
import vtkDataArray from "../../Core/DataArray";

/**
 * 
 */
export interface IFieldDataInitialValues {
	arrays?: Array<any>;
	copyFieldFlags?: Array<any>;
	doCopyAllOn?: boolean;
	doCopyAllOff?: boolean;
}

/**
 * 
 */
interface IArrayWithIndex {
	array: any,
	index: number;
}

export interface vtkFieldData extends vtkObject {

	/**
	 * 
	 */
	initialize(): void;

	/**
	 * 
	 */
	initializeFields(): void;

	/**
	 * 
	 * @param other 
	 */
	copyStructure(other: any): void;

	/**
	 * Get the number of arrays.
	 */
	getNumberOfArrays(): number;

	/**
	 * Get the number of active arrays.
	 */
	getNumberOfActiveArrays(): number;

	/**
	 * Add a new array.
	 * @param arr 
	 */
	addArray(arr: any): number;

	/**
	 * Remove all the arrays.
	 */
	removeAllArrays(): void;

	/**
	 * 
	 * @param {String} arrayName The name of the array.
	 */
	removeArray(arrayName: string): void;

	/**
	 * 
	 * @param {Number} arrayIdx The index of the array to remove. 
	 */
	removeArrayByIndex(arrayIdx: number): void;

	/**
	 * 
	 */
	getArrays(): any;

	/**
	 * 
	 * @param arraySpec 
	 */
	getArray(arraySpec: any): void;

	/**
	 * 
	 * @param {String} arrayName The name of the array.
	 */
	getArrayByName(arrayName: string): Nullable<vtkDataArray>;

	/**
	 * 
	 * @param {String} arrayName The name of the array.
	 */
	getArrayWithIndex(arrayName: string): IArrayWithIndex;

	/**
	 * 
	 * @param {Number} idx The index of the array.
	 */
	getArrayByIndex(idx: number): any | null;

	/**
	 * 
	 * @param {String} arrayName The name of the array.
	 */
	hasArray(arrayName: string): boolean;

	/**
	 * 
	 * @param {Number} idx The index of the array.
	 */
	getArrayName(idx: number): string;

	/**
	 * 
	 */
	getCopyFieldFlags(): object;

	/**
	 * 
	 * @param {String} arrayName The name of the array.
	 */
	getFlag(arrayName: string): boolean;

	/**
	 * 
	 * @param other 
	 * @param fromId 
	 * @param toId 
	 */
	passData(other: any, fromId?: number, toId?: number): void;

	/**
	 * 
	 * @param {String} arrayName The name of the array.
	 */
	copyFieldOn(arrayName: string): void;

	/**
	 * 
	 * @param {String} arrayName The name of the array.
	 */
	copyFieldOff(arrayName: string): void;

	/**
	 * 
	 */
	copyAllOn(): void;

	/**
	 * 
	 */
	copyAllOff(): void;

	/**
	 * 
	 */
	clearFieldFlags(): void;

	/**
	 * 
	 * @param other 
	 */
	deepCopy(other: any): void;

	/**
	 * 
	 * @param other 
	 */
	copyFlags(other: any): void;

	/**
	 * TODO: publicAPI.squeeze = () => model.arrays.forEach(entry => entry.data.squeeze());
	 */
	reset(): void;

	/**
	 * Return the `Modified Time` which is a monotonic increasing integer
	 * global for all vtkObjects.
	 *
	 * This allow to solve a question such as:
	 *  - Is that object created/modified after another one?
	 *  - Do I need to re-execute this filter, or not? ...
	 *
	 * @return {Number} the global modified time.
	 */
	getMTime(): number;

	/**
	 * TODO: publicAPI.getField = (ids, other) => { copy ids from other into this model's arrays }
	 * TODO: publicAPI.getArrayContainingComponent = (component) => ...
	 */
	getNumberOfComponents(): number;

	/**
	 * 
	 */
	getNumberOfTuples(): number;

	/**
	 *   
	 */
	getState(): object;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkFieldData characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IFieldDataInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IFieldDataInitialValues): void;

/**
 * Method used to create a new instance of vtkFieldData.
 * @param {IFieldDataInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IFieldDataInitialValues): vtkFieldData;

/**
 * 
 */
export declare const vtkFieldData: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkFieldData;
