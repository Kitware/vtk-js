import { VtkDataArray } from '../../../macro';

/**
 * Extract cell size from the typed array used to define the cell connectivity.
 * The input array is supposed to follow the given layout:
 * ```
 * const connectivityArray = [cellSize0, cell0_point0, ..., cell0_pointN, ..., cellSizeM, cellM_point0, ..., cellM_pointN]
 * const [cellSize0, ..., cellSizeM] = extractCellSizes(connectivityArray);
 * ```
 *
 * @param cellArray input connectivity array
 * @returns cellSizes array
 */
export function extractCellSizes(cellArray: Array<number>): Array<number>;

/**
 * Extract the number of cells from the typed array used to define the cell connectivity.
 *
 *  ```
 * const connectivityArray = [cellSize0, cell0_point0, ..., cell0_pointN, ..., cellSizeM, cellM_point0, ..., cellM_pointN]
 * const nbCells = getNumberOfCells(connectivityArray) // extractCellSizes(connectivityArray).length;
 * ```
 *
 * @param cellArray input connectivity array
 * @returns number of cells defined
 */
export function getNumberOfCells(cellArray: Array<number>): number;


export interface VtkCellArray extends VtkDataArray {
  /**
   * Return cached value of the number of cells unless it was not previously
   * computed.
   *
   * Optionally if you edited the array without the vtkCellArray aware,
   * you can force a recomputation.
   *
   * Note: Calling setData(array) will properly clear the cache.
   *
   * @param recompute (default: false) allow to force the cellSizes and numberOfCell computation
   */
  getNumberOfCells(recompute?: boolean): number;

  /**
   * Return cached reference of the cell sizes array unless it was not previously
   * computed.
   *
   * Optionally if you edited the array without the vtkCellArray aware,
   * you can force a recomputation.
   *
   * Note: Calling setData(array) will properly clear the cache.
   *
   * @param recompute (default: false) allow to force the cellSizes and numberOfCell computation
   */
  getCellSizes(recompute?: boolean): Array<number>;

  /**
   * Extract cell sub-array corresponding to only the point indexes.
   *
   * ```
   * const cellDefinition = [cellSize, p0, p1, ..., pn, cellSize1, pa, pb, pc, cellSize2, ...];
   * const cell1 = cellArray.getCell(n+1);
   * // cell1 == [pa, pb, pc]
   * ```
   *
   * @param location is the offset on where the cell definition should start.
   * @returns cell point index
   */
  getCell(location: number): Array<number>;
}


/**
 * Method use to decorate a given object (publicAPI+model) with vtkCellArray characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param initialValues (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: object): void;

/**
 * Method use to create a new instance of vtkCellArray
 * @param initialValues for pre-setting some of its content
 */
export function newInstance(initialValues?: object): VtkCellArray;

declare const vtkCellArray: {
  newInstance: typeof newInstance,
  extend: typeof extend,
  // static
  extractCellSizes: typeof extractCellSizes,
  getNumberOfCells: typeof getNumberOfCells,
};

export default vtkCellArray;
