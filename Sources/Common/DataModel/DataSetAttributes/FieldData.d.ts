import {
	VtkObject
} from 'vtk.js/Sources/macro';


/**
 * 
 */
interface IFieldDataInitialValues {
	/**
	 * 
	 * @default []
	 */
	arrays: Array<any>;

	/**
	 * 
	 * @default []
	 */
	copyFieldFlags: Array<any>;

	/**
	 * 
	 * @default true
	 */
	doCopyAllOn: boolean;

	/**
	 * 
	 * @default false
	 */
	doCopyAllOff: boolean;
}

/**
 * 
 */
interface IArrayWithIndex {
	/**
	 * 
	 */
	array: any[],
	/**
	 * 
	 */
	index: number;
}

export interface vtkFieldData extends VtkObject {

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
	 * 
	 * @return  
	 */
	getNumberOfArrays(): number;

	/**
	 * 
	 * @return  
	 */
	getNumberOfActiveArrays(): number;

	/**
	 * 
	 * @param arr 
	 * @return  
	 */
	addArray(arr: any): number;

	/**
	 * 
	 */
	removeAllArrays(): void;

	/**
	 * 
	 * @param arrayName 
	 */
	removeArray(arrayName: string): void;

	/**
	 * 
	 * @param arrayIdx 
	 */
	removeArrayByIndex(arrayIdx: any): void;

	/**
	 * 
	 * @return  
	 */
	getArrays(): any[];

	/**
	 * 
	 * @param arraySpec 
	 */
	getArray(arraySpec: any): void;

	/**
	 * 
	 * @param arrayName 
	 */
	getArrayByName(arrayName: string): any[] | null;

	/**
	 * 
	 * @param arrayName 
	 * @return  
	 */
	getArrayWithIndex(arrayName: string): IArrayWithIndex;

	/**
	 * 
	 * @param idx 
	 */
	getArrayByIndex(idx: any): any[] | null;

	/**
	 * 
	 * @param arrayName 
	 * @return  
	 */
	hasArray(arrayName: string): boolean;

	/**
	 * 
	 * @param idx 
	 * @return  
	 */
	getArrayName(idx: any): string;

	/**
	 * 
	 * @return  
	 */
	getCopyFieldFlags(): object;

	/**
	 * 
	 * @param arrayName 
	 * @return  
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
	 * @param arrayName 
	 */
	copyFieldOn(arrayName: string): void;

	/**
	 * 
	 * @param arrayName 
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
	 * TODO: getActualMemorySize
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
 * @param initialValues (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IFieldDataInitialValues): void;

/**
 * Method used to create a new instance of vtkFieldData.
 * @param initialValues for pre-setting some of its content
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
