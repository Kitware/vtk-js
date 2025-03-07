import { vtkObject, vtkRange } from '../../../interfaces';
import { float, int, Nullable, Range, TypedArray } from '../../../types';

/**
 * Output of the rangeHelper instance
 */
interface VtkStatisticInformation {
  min: number;
  max: number;
  count: number;
  sum: number;
  mean: number;
}

/**
 * Helper class used to compute data range of a set of numbers
 */
interface vtkRangeHelper {
  add(value: number): void;
  get(): VtkStatisticInformation;
  getRange(): vtkRange;
}

/**
 * The inital values of a vtkDataArray.
 */
export interface IDataArrayInitialValues {
  dataType?: string;
  empty?: boolean;
  name?: string;
  numberOfComponents?: number;
  rangeTuple?: Range;
  size?: number;
  values?: Array<number> | TypedArray;
}

export interface vtkDataArray extends vtkObject {
  /**
   * Get the size, in bytes, of the lowest-level element of an array.
   */
  getElementComponentSize(): number;

  /**
   * Get the component for a given tupleIdx.
   * @param {Number} tupleIdx
   * @param {Number} [componentIndex] (default: 0)
   */
  getComponent(tupleIdx: number, componentIndex?: number): number;

  /**
   * Set the component value for a given tupleIdx and componentIndex.
   * @param {Number} tupleIdx
   * @param {Number} componentIndex
   * @param {Number} value
   */
  setComponent(tupleIdx: number, componentIndex: number, value: number): void;

  /**
   *
   */
  getData(): number[] | TypedArray;

  /**
   * Call this method when the underlying data has changed
   * This method calls `modified()`
   * For example, when you need to modify chunks of the array, it is faster
   * to get the underlying array with `getData()`, modify it, and then call
   * `dataChange()`.
   */
  dataChange(): void;

  /**
   * Get the range of the given component.
   *
   * @param {Number} componentIndex (default: -1)
   */
  getRange(componentIndex?: number): Range;

  /**
   *
   * @param {vtkRange} rangeValue
   * @param {Number} componentIndex
   */
  setRange(rangeValue: vtkRange, componentIndex: number): Range;

  /**
   * Returns an array of the ranges for each component of the DataArray.
   * Defaults to computing all the ranges if they aren't already computed.
   *
   * Passing `getRanges(false)` will return  a clone of the ranges that have
   * already been computed. This is useful when you want to avoid recomputing
   * the ranges, which can be expensive.
   *
   * @param {boolean} [computeRanges] (default: true)
   * @returns {vtkRange[]}
   */
  getRanges(computeRanges: boolean): vtkRange[];

  /**
   * Set the given tuple at the given index.
   * @param {Number} idx
   * @param {Array<Number>|TypedArray} tuple
   */
  setTuple(idx: number, tuple: Array<number> | TypedArray): void;

  /**
   * Set the given tuples starting at the given index.
   * @param {Number} idx
   * @param {Array<Number>|TypedArray} tuples
   */
  setTuples(idx: number, tuples: Array<number> | TypedArray): void;

  /**
   * Get the tuple at the given index.
   *
   * For performance reasons, it is advised to pass a 'tupleToFill':
   * `const x = [];`
   * `for (int i = 0; i < N; ++i) {
   * `  dataArray.getTuple(idx, x);`
   * `  ...`
   * instead of:
   * `for (int i = 0; i < N; ++i) {
   * `  const x = dataArray.getTuple(idx);`
   * `...`
   * @param {Number} idx
   * @param {Number[]|TypedArray} [tupleToFill] (default [])
   * @returns {Number[]|TypedArray}
   */
  getTuple(
    idx: number,
    tupleToFill?: number[] | TypedArray
  ): number[] | TypedArray;

  /**
   * Get the tuples between fromId (inclusive) and toId (exclusive).
   *
   * If fromId or toId is negative, it refers to a tuple index from the
   * end of the underlying typedArray.
   * If the range between fromId and toId is invalid, getTuples returns
   * null.
   *
   * NOTE: Any changes to the returned TypedArray will result in changes to
   * this DataArray's underlying TypedArray.
   *
   * @param {Number} [fromId] (default: 0)
   * @param {Number} [toId] (default: publicAPI.getNumberOfTuples())
   * @returns {Nullable<TypedArray>}
   */
  getTuples(fromId?: number, toId?: number): Nullable<TypedArray>;

  /**
   * Insert the given tuple at the given index.
   * NOTE: May resize the data values array. "Safe" version of setTuple.
   *
   * A typical usage is when `vtkDataArray` is initialized with
   * `initialValues = { size: 0, values: new Uint8Array(1000) }`, where
   * an empty but pre-allocated array with 1'000 components is created.
   * The component values can then be inserted with `insertTuple()` or
   * `insertNextTuple()` without requiring new memory allocation until
   * the size of 1'000 is exceeded (e.g. after inserting the 250th
   * 4-component tuple).
   *
   * `insertTuple` increases the number of tuples (`getNumberOfTuples()`).
   *
   * @see insertNextTuple
   * @see getNumberOfTuples
   *
   * @param {Number} idx
   * @param {Array<Number>|TypedArray} tuple
   * @returns {Number} Index of the inserted tuple
   */
  insertTuple(idx: number, tuple: Array<number> | TypedArray): number;

  /**
   * Insert tuples starting at the given idx.
   *
   * @param {Number} idx
   * @param {Array<Number>|TypedArray} tuples Flat array of tuples to insert
   * @returns The index of the last inserted tuple
   */
  insertTuples(idx: number, tuples: Array<number> | TypedArray): number;

  /**
   * Insert the given tuple at the next available slot and return the index of the insertion.
   * NOTE: May resize the data values array. "Safe" version of setTuple.
   *
   * @see insertTuple
   *
   * @param {Array<Number>|TypedArray} tuple
   * @returns {Number} Index of the inserted tuple.
   */
  insertNextTuple(tuple: Array<number> | TypedArray): number;

  /**
   * Convenience function to insert an array of tuples with insertNextTuple.
   * NOTE: tuples.length must be a multiple of `getNumberOfComponents`.
   * @param {Array<Number>|TypedArray} tuples
   * @returns The index of the last inserted tuple
   */
  insertNextTuples(tuples: Array<number> | TypedArray): number;

  /**
   *
   * @param {Number} [idx] (default: 1)
   * @returns {Number}
   */
  getTupleLocation(idx?: number): number;

  /**
   * Get the dimension (n) of the components.
   * @returns {Number}
   */
  getNumberOfComponents(): number;

  /**
   * Get the actual  number of values in the array, which is equal to `getNumberOfTuples() * getNumberOfComponents()`.
   * @returns {Number}
   */
  getNumberOfValues(): number;

  /**
   * Get the actual number of complete tuples (a component group) in the array.
   * @returns {Number}
   */
  getNumberOfTuples(): number;

  /**
   * Convenient method to search the index of the first matching tuple in the array.
   * This is a naïve search, consider using a "locator" instead.
   * @param {Array<Number>|TypedArray} tupleToSearch
   * @param {Number} precision (1e-6 by default)
   * @returns {Number} the index of the tuple if found, -1 otherwise.
   */
  findTuple(
    tupleToSearch: Array<number> | TypedArray,
    precision?: number
  ): number;

  /**
   * Get the data type of this array as a string.
   * @returns {String}
   */
  getDataType(): string;

  /**
   * Return a clone of this array.
   * @returns {vtkDataArray}
   */
  newClone(): vtkDataArray;

  /**
   * Get the name of the array.
   * @returns {String}
   */
  getName(): string;

  /**
   * Set the data of this array.
   * Optionally pass ´numberOfComponents´ to overwrite this dataArray's
   * numberOfComponents.
   * If this dataArray's numberOfComponents doesn't divide the given array's
   * length, this dataArray's numberOfComponents is set to 1.
   *
   * @param {Number[]|TypedArray} typedArray The Array value.
   * @param {Number} [numberOfComponents]
   */
  setData(typedArray: number[] | TypedArray, numberOfComponents?: number): void;

  /**
   * Get the state of this array.
   * @returns {object}
   */
  getState(): object;

  /**
   * Deep copy of another vtkDataArray into this one.
   * @param {vtkDataArray} other
   */
  deepCopy(other: vtkDataArray): void;

  /**
   * Interpolate between the tuples retrieved from source1
   * and source2 with the resp. indices and set the
   * resulting tuple to the idx of this DataArray.
   *
   * @param {int} idx,
   * @param {vtkDataArray} source1,
   * @param {int} source1Idx,
   * @param {vtkDataArray} source2,
   * @param {int} source2Idx,
   * @param {float} t
   */
  interpolateTuple(
    idx: int,
    source1: vtkDataArray,
    source1Idx: int,
    source2: vtkDataArray,
    source2Idx: int,
    t: float
  ): void;

  /**
   * Resize the array to the requested number of tuples and preserve data.
   * Increasing the array size may allocate extra memory beyond what was
   * requested.
   * Decreasing the array size will trim memory to the requested size.
   * model.size WILL be modified according ot the new size.
   * If requestedNumTuples > getNumberOfTuples(),
   * it creates a new typed array and copies the old values to the new array.
   * If requestedNumTuples < getNumberOfTuples(), the typed array is untouched,
   * only model.size is modified.
   * @param {Number} requestedNumTuples Final expected number of tuples; must be >= 0
   * @returns {Boolean} True if a resize occured, false otherwise
   * @see insertNextTuple
   * @see insertNextTuples
   * @see initialize
   */
  resize(requestedNumTuples: number): boolean;

  /**
   * Reset this array.
   * NOTE: This won't touch the actual memory of the underlying typedArray.
   * @see insertNextTuple
   * @see insertNextTuples
   */
  initialize(): void;

  // --- via macro --

  /**
   * Set the name of this array.
   * @param {String} name
   * @returns {Boolean}
   */
  setName(name: string): boolean;

  /**
   * Set the dimension (n) of the components.
   * @param {Number} numberOfComponents
   */
  setNumberOfComponents(numberOfComponents: number): boolean;
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

/**
 * Compute range of a given array. The array could be composed of tuples and
 * individual component range could be computed as well as magnitude.
 *
 * ```js
 * const array = [x0, y0, z0, x1, y1, z1, ..., xn, yn, zn];
 * const { min: yMin, max: yMax } = computeRange(array, 1, 3);
 * const { min: minMagnitude, max: maxMagnitude } = computeRange(array, -1, 3);
 * ```
 *
 * @param {Number[]} values Array to go through to extract the range from
 * @param {Number} [component] (default: 0) indice to use inside tuple size
 * @param {Number} [numberOfComponents] (default: 1) size of the tuple
 */
export function computeRange(
  values: ArrayLike<number>,
  component?: number,
  numberOfComponents?: number
): vtkRange;

/**
 * Compute range of a given array, it only supports 1D arrays.
 *
 * @param {Number[]} values Array to go through to extract the range from
 * @param {Number} offset offset index to select the desired component in the tuple
 * @param {Number} numberOfComponents size of tuple in a multi-channel array
 */
export function fastComputeRange(
  values: ArrayLike<number>,
  offset: number,
  numberOfComponents: number
): vtkRange;

/**
 * @deprecated please use `fastComputeRange` instead
 * Create helper object that can be used to gather min, max, count, sum of
 * a set of values.
 */
export function createRangeHelper(): vtkRangeHelper;

/**
 * Return the name of a typed array
 *
 * ```js
 * const isFloat32 = ('Float32Array' === getDataType(array));
 * const clone = new macro.TYPED_ARRAYS[getDataType(array)](array.length);
 * ```
 *
 * @param typedArray to extract its type from
 */
export function getDataType(typedArray: TypedArray): string;

/**
 * Return the max norm of a given vtkDataArray
 *
 * @param dataArray to process
 */
export function getMaxNorm(dataArray: vtkDataArray): number;

/**
 * Method use to decorate a given object (publicAPI+model) with vtkDataArray characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {object} [initialValues] (default: {}) Must pass a number > 0 for `size` except if `empty: true` is also passed or a non-empty typed array for `values`.
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IDataArrayInitialValues
): void;

// ----------------------------------------------------------------------------

/**
 * Method use to create a new instance of vtkDataArray
 *
 * If the provided `values` is a plain Array and `dataType` is not explicitly provided,
 * then the vtkDataArray data type will be a Float32Array.
 *
 * @param {object} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: object): vtkDataArray;

/**
 * Constants capturing the number of bytes per element based on its data type.
 */
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

/**
 * Constants capturing the various VTK data types.
 */
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

/**
 * vtkDataArray is an abstract superclass for data array objects containing
 * numeric data.
 */
export declare const vtkDataArray: {
  newInstance: typeof newInstance;
  extend: typeof extend;
  // static
  computeRange: typeof computeRange;
  createRangeHelper: typeof createRangeHelper;
  fastComputeRange: typeof fastComputeRange;
  getDataType: typeof getDataType;
  getMaxNorm: typeof getMaxNorm;
  // constants
  DataTypeByteSize: typeof DataTypeByteSize;
  VtkDataTypes: typeof VtkDataTypes;
  DefaultDataType: VtkDataTypes;
};

export default vtkDataArray;
