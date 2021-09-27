import { vtkObject } from "../../../interfaces" ;

/**
 *
 */
export interface IVariantArrayInitialValues {
	name?: string;
	numberOfComponents?: number;
	size: number;
	dataType?: string;
}

export interface vtkVariantArray extends vtkObject {
	
	/**
	 * Get the data component at the location specified by tupleIdx and compIdx.
	 * @param {Number} tupleIdx 
	 * @param {Number} [compIdx] 
	 */
	getComponent(tupleIdx: number, compIdx?: number): void;

	/**
	 * 
	 */
	getData(): Array<any>;

	/**
	 * 
	 */
	getDataType(): string;

	/**
	 * 
	 */
	getName(): string;

	/**
	 * 
	 */
	getNumberOfComponents(): number;

	/**
	 * 
	 */
	getNumberOfValues(): number;

	/**
	 * 
	 */
	getNumberOfTuples(): number;

	/**
	 * 
	 * @param {Number} idx 
	 * @param {Array<any>} [tupleToFill] 
	 */
	getTuple(idx: number, tupleToFill?: Array<any>): Array<any>;

	/**
	 * 
	 * @param {Number} [idx] 
	 */
	getTupleLocation(idx?: number): number;

	/**
	 * 
	 */
	newClone(): void;

	/**
	 * Set the data component at the location specified by tupleIdx and compIdx
	 * to value.
	 * Note that i is less than NumberOfTuples and j is less than
	 *  NumberOfComponents. Make sure enough memory has been allocated
	 * (use SetNumberOfTuples() and SetNumberOfComponents()).
	 * @param {Number} tupleIdx 
	 * @param {Number} compIdx 
	 * @param {String} value 
	 */
	setComponent(tupleIdx: number, compIdx: number, value: string): void;

	/**
	 * 
	 * @param {Array<any>} array 
	 * @param {Number} numberOfComponents 
	 */
	setData(array: Array<any>, numberOfComponents: number): void;

	/**
	 * 
	 */
	setName(name: string): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkVariantArray characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IVariantArrayInitialValues} initialValues (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues: IVariantArrayInitialValues): void;

/**
 * Method used to create a new instance of vtkVariantArray
 * @param {IVariantArrayInitialValues} initialValues for pre-setting some of its content
 */
export function newInstance(initialValues: IVariantArrayInitialValues): vtkVariantArray;

/**
 * An array holding vtkVariants.
 */
export declare const vtkVariantArray: {
	newInstance: typeof newInstance;
	extend: typeof extend;
}
export default vtkVariantArray;
