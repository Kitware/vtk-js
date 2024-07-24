import { vtkObject } from '../../../interfaces';
import { Nullable } from '../../../types';
import type vtkDataArray from '../../Core/DataArray';

/**
 *
 */
export interface IFieldDataInitialValues {
  arrays?: vtkDataArray[];
  copyFieldFlags?: Array<any>;
  doCopyAllOn?: boolean;
  doCopyAllOff?: boolean;
}

/**
 *
 */
interface IArrayWithIndex {
  array: vtkDataArray;
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
   * @param {vtkFieldData} other
   */
  copyStructure(other: vtkFieldData): void;

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
   * If an array with the same name already exists, it is replaced instead.
   * @param {vtkDataArray} arr
   */
  addArray(arr: vtkDataArray): number;

  /**
   * Remove all the arrays.
   */
  removeAllArrays(): void;

  /**
   * Remove an array.
   * @param {String} arrayName The name of the array.
   */
  removeArray(arrayName: string): void;

  /**
   * Remove an array by its index.
   * @param {Number} arrayIdx The index of the array to remove.
   */
  removeArrayByIndex(arrayIdx: number): void;

  /**
   * Get all arrays.
   */
  getArrays(): vtkDataArray[];

  /**
   *
   * @param {number | string} arraySpec index or name of the array
   */
  getArray(arraySpec: number | string): Nullable<vtkDataArray>;

  /**
   * Get an array by its name.
   * @param {String} arrayName The name of the array.
   */
  getArrayByName(arrayName: string): Nullable<vtkDataArray>;

  /**
   *
   * @param {String} arrayName The name of the array.
   */
  getArrayWithIndex(arrayName: string): IArrayWithIndex;

  /**
   * Get an array by its index.
   * @param {Number} idx The index of the array.
   */
  getArrayByIndex(idx: number): Nullable<vtkDataArray>;

  /**
   * Return true if there exists an array with the given arraName. False otherwise.
   * @param {String} arrayName The name of the array.
   */
  hasArray(arrayName: string): boolean;

  /**
   * Get the name of an array at the given index.
   * @param {Number} idx The index of the array.
   */
  getArrayName(idx: number): string;

  /**
   *
   */
  getCopyFieldFlags(): object;

  /**
   * Get the flag of the array that has the given name.
   * @param {String} arrayName The name of the array.
   */
  getFlag(arrayName: string): boolean;

  /**
   * Pass data from one fieldData to another at the given index.
   * @param {vtkFieldData} other
   * @param {Number} [fromId] (default: -1)
   * @param {Number} [toId] (default: -1)
   */
  passData(other: vtkFieldData, fromId?: number, toId?: number): void;

  /**
   * Works like passData, but interpolates the values between the two given fromIds.
   * @param {vtkFieldData} other
   * @param {Number} [fromId1] (default: -1)
   * @param {Number} [fromId2] (default: -1)
   * @param {Number} [toId] (default: -1)
   * @param {Number} [t] (default: 0.5)
   */
  interpolateData(
    other: vtkFieldData,
    fromId1?: number,
    fromId2?: number,
    toId?: number,
    t?: number
  ): void;

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
   * @param {vtkFieldData} other
   */
  deepCopy(other: vtkFieldData): void;

  /**
   *
   * @param {vtkFieldData} other
   */
  copyFlags(other: vtkFieldData): void;

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
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IFieldDataInitialValues
): void;

/**
 * Method used to create a new instance of vtkFieldData.
 * @param {IFieldDataInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IFieldDataInitialValues
): vtkFieldData;

/**
 *
 */
export declare const vtkFieldData: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkFieldData;
