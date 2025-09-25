import { vtkObject } from '../../../interfaces';
import vtkDataSet from '../DataSet';

/**
 *
 */
export interface ILocatorInitialValues {
  dataSet?: vtkDataSet;
  maxLevel?: number;
  level?: number;
  automatic?: boolean;
  tolerance?: number;
  useExistingSearchStructure?: boolean;
}

export interface vtkLocator extends vtkObject {
  /**
   * Get whether locator depth/resolution of locator is computed automatically
   * from average number of entities in bucket.
   */
  getAutomatic(): boolean;

  /**
   * Get the dataset associated with this locator.
   *
   * @returns {vtkDataSet} The dataset associated with this locator.
   */
  getDataSet(): vtkDataSet;

  /**
   * Get the current level of the locator.
   *
   * @returns {Number} The current level of the locator.
   */
  getLevel(): number;

  /**
   * Get the maximum level of the locator.
   *
   * @returns {Number} The maximum level of the locator.
   */
  getMaxLevel(): number;

  /**
   * Get the tolerance used for the locator.
   *
   * @returns {Number} The tolerance value.
   */
  getTolerance(): number;

  /**
   * Get whether to use an existing search structure.
   *
   * @returns {Boolean} Whether an existing search structure is used.
   */
  getUseExistingSearchStructure(): boolean;

  /**
   * Set whether locator depth/resolution of locator is computed automatically
   * from average number of entities in bucket.
   *
   * @param {Boolean} automatic - The automatic flag.
   * @returns {Boolean} Whether the operation was successful.
   */
  setAutomatic(automatic: boolean): boolean;

  /**
   * Set the dataset associated with this locator.
   *
   * @param {vtkDataSet} dataSet - The dataset to associate with this locator.
   * @returns {Boolean} Whether the operation was successful.
   */
  setDataSet(dataSet: vtkDataSet): boolean;

  /**
   * Set the current level of the locator.
   *
   * @param {Number} level - The level to set.
   * @returns {Boolean} Whether the operation was successful.
   */
  setLevel(level: number): boolean;

  /**
   * Set the maximum level of the locator.
   *
   * @param {Number} maxLevel - The maximum level to set.
   * @returns {Boolean} Whether the operation was successful.
   */
  setMaxLevel(maxLevel: number): boolean;

  /**
   * Set the tolerance used for the locator.
   *
   * @param {Number} tolerance - The tolerance value to set.
   * @returns {Boolean} Whether the operation was successful.
   */
  setTolerance(tolerance: number): boolean;

  /**
   * Set whether to use an existing search structure.
   *
   * @param {Boolean} useExistingSearchStructure - Whether to use an existing search structure.
   * @returns {Boolean} Whether the operation was successful.
   */
  setUseExistingSearchStructure(useExistingSearchStructure: boolean): boolean;
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

/**
 * Method use to decorate a given object (publicAPI+model) with vtkLocator characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ILocatorInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ILocatorInitialValues
): void;

/**
 * vtkLocator is an abstract base class for spatial search objects, or locators.
 * The principle behind locators is that they divide 3-space into small regions
 * (or "buckets") that can be quickly found in response to queries about point
 * location, line intersection, or object-object intersection.
 */
export declare const vtkLocator: {
  extend: typeof extend;
};

export default vtkLocator;
