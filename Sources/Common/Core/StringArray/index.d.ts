import { vtkObject } from "../../../interfaces" ;

/**
 *
 */
export interface IStringArrayInitialValues {
	name?: string;
	numberOfComponents?: number;
	size: number;
	dataType?: string;
}

export interface vtkStringArray extends vtkObject {
	
	/**
	 * Get the data component at the location specified by tupleIdx and compIdx.
	 * @param {Number} tupleIdx 
	 * @param {Number} [compIdx] 
	 */
	getComponent(tupleIdx: number, compIdx?: number): void;

	/**
	 * 
	 */
	getData(): string[];

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
	 * @param {String[]} [tupleToFill] 
	 */
	getTuple(idx: number, tupleToFill?: string[]): string[];

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
	 * @param {String[]} array 
	 * @param {Number} numberOfComponents 
	 */
	setData(array: string[], numberOfComponents: number): void;

	/**
	 * 
	 */
	setName(name: string): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkStringArray characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IStringArrayInitialValues} initialValues (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues: IStringArrayInitialValues): void;

/**
 * Method used to create a new instance of vtkStringArray
 * @param {IStringArrayInitialValues} initialValues for pre-setting some of its content
 */
export function newInstance(initialValues: IStringArrayInitialValues): vtkStringArray;

/**
 * Points and cells may sometimes have associated data that are stored as
 * strings, e.g. labels for information visualization projects. This class
 * provides a clean way to store and access those strings.
 */
export declare const vtkStringArray: {
	newInstance: typeof newInstance;
	extend: typeof extend;
}
export default vtkStringArray;
