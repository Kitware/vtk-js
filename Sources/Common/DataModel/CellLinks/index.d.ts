import { vtkObject } from '../../../interfaces';
import { Nullable } from '../../../types';

export interface ICellLinksInitialValues {}

/**
 * Link record for a point: number of incident cells and their ids.
 */
export interface ICellLink {
  /**
   * Number of cells using the point.
   */
  ncells: number;
  /**
   * Cell ids that use the point.
   */
  cells: Nullable<number[]>;
}

export interface vtkCellLinks extends vtkObject {
  /**
   * Build the link list array from the input dataset.
   * The resulting structure maps each point id to the cells that reference it.
   */
  buildLinks(data: any): void;

  /**
   * Allocate storage for a number of links (typically the number of points).
   * @param {Number} numLinks Number of point links to allocate.
   * @param {Number} [extSize=1000] Growth factor used for future extensions.
   */
  allocate(numLinks: number, extSize?: number): void;

  /**
   * Allocate per-point cell-id arrays based on precomputed link counts.
   * @param {Number} n Number of links (points).
   */
  allocateLinks(n: number): void;

  /**
   * Clear out previously allocated link structures.
   */
  initialize(): void;

  /**
   * Get the full link structure for a point id.
   * @param {Number} ptId Point id.
   */
  getLink(ptId: number): ICellLink;

  /**
   * Get the number of cells using the point.
   * @param {Number} ptId Point id.
   */
  getNcells(ptId: number): number;

  /**
   * Return the list of cell ids that use the point.
   * @param {Number} ptId Point id.
   */
  getCells(ptId: number): Nullable<number[]>;

  /**
   * Insert a new point entry into the links structure.
   * @param {Number} numLinks Initial size of the point's cell-id list.
   */
  insertNextPoint(numLinks: number): void;

  /**
   * Append a cell id to the point's cell-id list.
   * @param {Number} ptId Point id.
   * @param {Number} cellId Cell id.
   */
  insertNextCellReference(ptId: number, cellId: number): void;

  /**
   * Delete a point by removing all links to using cells.
   * @param {Number} ptId Point id.
   */
  deletePoint(ptId: number): void;

  /**
   * Remove the reference from a point to a cell.
   * @param {Number} cellId Cell id.
   * @param {Number} ptId Point id.
   */
  removeCellReference(cellId: number, ptId: number): void;

  /**
   * Add a reference from a point to a cell.
   * @param {Number} cellId Cell id.
   * @param {Number} ptId Point id.
   */
  addCellReference(cellId: number, ptId: number): void;

  /**
   * Resize a point's cell-id list.
   * @param {Number} ptId Point id.
   * @param {Number} size New list size.
   */
  resizeCellList(ptId: number, size: number): void;

  /**
   * Reclaim unused memory.
   */
  squeeze(): void;

  /**
   * Reset to an empty state without freeing memory.
   */
  reset(): void;

  /**
   * Deep-copy from another cell-links instance.
   * @param src Source object.
   */
  deepCopy(src: any): void;

  /**
   * Increment the count of cells using a point.
   * @param {Number} ptId Point id.
   */
  incrementLinkCount(ptId: number): void;

  /**
   * Insert a cell id into a point's cell-id list at a specific position.
   * @param {Number} ptId Point id.
   * @param {Number} pos Position inside the point's list.
   * @param {Number} cellId Cell id.
   */
  insertCellReference(ptId: number, pos: number, cellId: number): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkCellLinks characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ICellLinksInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ICellLinksInitialValues
): void;

/**
 * Method used to create a new instance of vtkCellLinks.
 * @param {ICellLinksInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: ICellLinksInitialValues
): vtkCellLinks;

/**
 * vtkCellLinks maps each point to the cells that reference it.
 */
export declare const vtkCellLinks: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkCellLinks;
