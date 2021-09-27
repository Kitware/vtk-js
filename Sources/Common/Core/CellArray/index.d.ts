import { TypedArray } from "../../../types";
import vtkDataArray from "../../Core/DataArray";


/**
 *
 */
export interface ICellArrayInitialValues {
	empty?: boolean;
	numberOfComponents?: number;
}

export interface vtkCellArray extends vtkDataArray {

	/**
	 * Get the number of cells in the array.
	 * @param {Boolean} [recompute] Recompute the number of cells.
	 */
	getNumberOfCells(recompute?: boolean): number;

	/**
	 *
	 * @param {Boolean} [recompute] Recompute the cell sizes.
	 */
	getCellSizes(recompute?: boolean): any;

	/**
	 *
	 * @param {TypedArray} typedArray The typedArray value.
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
 * @param {ICellArrayInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ICellArrayInitialValues): void;

/**
 * Method used to create a new instance of vtkCellArray
 * @param {ICellArrayInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: ICellArrayInitialValues): vtkCellArray;


/**
 * @static
 * @param cellArray
 */
export function extractCellSizes(cellArray: any): any;

 /**
  * @static
  * @param cellArray
  */
export function getNumberOfCells(cellArray: any): any;

/**
 * vtkCellArray stores dataset topologies as an explicit connectivity table
 * listing the point ids that make up each cell.
 * 
 * @see [vtkDataArray](./Common_Core_DataArray.html)
 */
export declare const vtkCellArray: {
    newInstance: typeof newInstance;
    extend: typeof extend;
	extractCellSizes: typeof extractCellSizes;
	getNumberOfCells: typeof getNumberOfCells;
}
export default vtkCellArray;
