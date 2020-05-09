import { VtkObject } from '../../../macro';

interface VtkStatisticInformation {
  min: number;
  max: number;
  count: number;
  sum: number;
  mean: number;
}

export interface VtkRange {
  min: number;
  max: number;
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
export function computeRange(values: Array<number>, component?: number, numberOfComponents: number): VtkRange;

export function createRangeHelper(): VtkRangeHelper
export function getDataType(typedArray: any): string
export function getMaxNorm(dataArray: VtkDataArray): number

// ----------------------------------------------------------------------------
// vtkDataArray methods
// ----------------------------------------------------------------------------

export interface VtkDataArray {
  getElementComponentSize(): number;
  /**
   *
   * @param tupleIdx
   * @param componentIndex (default: 0)
   */
  getComponent(tupleIdx: number, componentIndex: number): number;
  setComponent(tupleIdx: number, componentIndex: number, value: number): void;
  getData: () => Array<number>;
  /**
   * Return the range of the given component.
   *
   * @param componentIndex (default: -1)
   */
  getRange(componentIndex?: number): VtkRange;
  setRange(rangeValue: VtkRange, componentIndex: number): [number, number];
  setTuple(idx: number, tuple: Array<number>): void;
  /**
   *
   * @param idx
   * @param tupleToFill (default [])
   */
  getTuple(idx: number, tupleToFill?: Array<number>): Array<number>;
  /**
   *
   * @param idx (default: 1)
   */
  getTupleLocation(idx: number): number;
  getNumberOfComponents: () => number;
  getNumberOfValues: () => number;
  getNumberOfTuples: () => number;
  getDataType: () => string;
  newClone: () => VtkDataArray;
  getName: () => string;
  setData: (typedArray: Array<number>, numberOfComponents: number) => void;
  getState: () => object;
  // --- via macro --
  setName: (name: string) => boolean;
  setNumberOfComponents: (numberOfComponents: number) => boolean;
}

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
