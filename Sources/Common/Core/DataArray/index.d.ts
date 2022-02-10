import { vtkObject, vtkRange } from "../../../interfaces";
import { TypedArray } from "../../../types";


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
	getData(): TypedArray;

	/**
	 * Get the range of the given component.
	 *
	 * @param {Number} componentIndex (default: -1)
	 */
	getRange(componentIndex?: number): vtkRange;

	/**
	 *
	 * @param {vtkRange} rangeValue
	 * @param {Number} componentIndex
	 */
	setRange(rangeValue: vtkRange, componentIndex: number): [number, number];

	/**
	 *
	 * @param {Number} idx
	 * @param {Number[]} tuple
	 */
	setTuple(idx: number, tuple: number[]): void;

	/**
	 *
	 * @param {Number} idx
	 * @param {Number[]} [tupleToFill] (default [])
	 */
	getTuple(idx: number, tupleToFill?: number[]): number[];

	/**
	 *
	 * @param {Number} [idx] (default: 1)
	 */
	getTupleLocation(idx?: number): number;

	/**
	 * Get the dimension (n) of the components.
	 */
	getNumberOfComponents(): number;

	/**
	 * Get the total number of values in the array.
	 */
	getNumberOfValues(): number;

	/**
	 * Get the number of complete tuples (a component group) in the array.
	 */
	getNumberOfTuples(): number;

	/**
	 *
	 */
	getDataType(): string;

	/**
	 *
	 */
	newClone(): vtkDataArray;

	/**
	 *
	 */
	getName(): string;

	/**
	 *
	 * @param {TypedArray} typedArray
	 * @param {Number} [numberOfComponents]
	 */
	setData(typedArray: TypedArray, numberOfComponents?: number): void;

	/**
	 *
	 */
	getState(): object;

	// --- via macro --

	/**
	 *
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
export function computeRange(values: number[], component?: number, numberOfComponents?: number): vtkRange;

/**
 * Compute range of a given array, it only supports 1D arrays.
 *
 * @param {Number[]} values Array to go through to extract the range from
 * @param {Number} offset offset index to select the desired component in the tuple
 * @param {Number} numberOfComponents size of tuple in a multi-channel array
 */
export function fastComputeRange(values: number[], offset: number, numberOfComponents: number): vtkRange;

/**
 * @deprecated please use `fastComputeRange` instead
 * Create helper object that can be used to gather min, max, count, sum of
 * a set of values.
 */
export function createRangeHelper(): vtkRangeHelper

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
export function getDataType(typedArray: TypedArray): string

/**
 * Return the max norm of a given vtkDataArray
 *
 * @param dataArray to process
 */
export function getMaxNorm(dataArray: vtkDataArray): number

/**
 * Method use to decorate a given object (publicAPI+model) with vtkDataArray characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {object} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: object): void;

// ----------------------------------------------------------------------------

/**
 * Method use to create a new instance of vtkDataArray
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
	newInstance: typeof newInstance,
	extend: typeof extend,
	// static
	computeRange: typeof computeRange,
	createRangeHelper: typeof createRangeHelper,
  fastComputeRange: typeof fastComputeRange,
	getDataType: typeof getDataType,
	getMaxNorm: typeof getMaxNorm,
	// constants
	DataTypeByteSize: typeof DataTypeByteSize,
	VtkDataTypes: typeof VtkDataTypes,
	DefaultDataType: VtkDataTypes,
};

export default vtkDataArray;
