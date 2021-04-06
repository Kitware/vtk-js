import { TypedArray, VtkDataArray } from "vtk.js/Sources/macro";


/**
 * 
 */
interface ICellArrayInitialValues {

	/**
	 * 
	 */
	empty?: boolean;

	 /**
	  * 
	  */
	numberOfComponents?: number;
}

export interface vtkCellArray extends VtkDataArray {

	/**
	 * 
	 * @param recompute 
	 */
	getNumberOfCells(recompute?: boolean): number;

	/**
	 * 
	 * @param recompute 
	 */
	getCellSizes(recompute?: boolean): any;

	/**
	 * 
	 * @param typedArray 
	 */
	setData(typedArray: TypedArray): void;
	
	/**
	 * Returns the point indexes at the given location as a subarray.
	 * @param loc 
	 */
	getCell(loc: any): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkCellArray characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param initialValues (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ICellArrayInitialValues): void;

/**
 * Method used to create a new instance of vtkCellArray
 * @param initialValues for pre-setting some of its content
 */
export function newInstance(initialValues?: ICellArrayInitialValues): vtkCellArray;


/**
 * 
 * @param cellArray 
 */
export function extractCellSizes(cellArray : any): any;

 /**
  * 
  * @param cellArray 
  */
export function getNumberOfCells(cellArray : any): any;

/**
 * vtkCellArray stores dataset topologies as an explicit connectivity table
 * listing the point ids that make up each cell.
 */

export declare const vtkCellArray: {
    newInstance: typeof newInstance;
    extend: typeof extend;
	extractCellSizes: typeof extractCellSizes;
	getNumberOfCells: typeof getNumberOfCells;
}
export default vtkCellArray;
