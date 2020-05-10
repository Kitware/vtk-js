import { VtkObject, VtkDataArray, VtkRange } from '../../../macro';

interface VtkStatisticInformation {
  min: number;
  max: number;
  count: number;
  sum: number;
  mean: number;
}

interface VtkRangeHelper {
  add(value: number): void;
  get(): VtkStatisticInformation;
  getRange(): VtkRange;
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

/**
 *
 * @param values
 * @param component (default: 0)
 * @param numberOfComponents (default: 1)
 */
export function computeRange(values: Array<number>, component?: number, numberOfComponents?: number): VtkRange;

export function createRangeHelper(): VtkRangeHelper
export function getDataType(typedArray: any): string
export function getMaxNorm(dataArray: VtkDataArray): number

// ----------------------------------------------------------------------------
// vtkDataArray methods
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------

/**
 *
 * @param publicAPI
 * @param model
 * @param initialValues (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: object): void;

// ----------------------------------------------------------------------------

export function newInstance(initialValues?: object): VtkObject | VtkDataArray;

// ----------------------------------------------------------------------------

export enum DataTypeByteSize {
  Int8Array,
  Uint8Array,
  Uint8ClampedArray,
  Int16Array,
  Uint16Array,
  Int32Array,
  Uint32Array,
  Float32Array,
  Float64Array,
}

export enum VtkDataTypes {
  VOID,
  CHAR,
  SIGNED_CHAR,
  UNSIGNED_CHAR,
  SHORT,
  UNSIGNED_SHORT,
  INT,
  UNSIGNED_INT,
  FLOAT,
  DOUBLE,
}

export default {
  newInstance,
  extend,
  // static
  computeRange,
  createRangeHelper,
  getDataType,
  getMaxNorm,
  // constants
  DataTypeByteSize,
  VtkDataTypes,
  DefaultDataType: VtkDataTypes,
};
