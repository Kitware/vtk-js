interface VtkStatisticInformation {
  min: number;
  max: number;
  count: number;
  sum: number;
  mean: number;
}

interface VtkRange {
  min: number;
  max: number;
}

interface VtkRangeHelper {
  add: (value) => void;
  get: () => VtkStatisticInformation;
  getRange(): () => VtkRange;
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export const STATIC = {
  computeRange: (values: Array<number>, component: number = 0, numberOfComponents: number = 1) => VtkRange,
  createRangeHelper: () => VtkRangeHelper,
  getDataType: (typedArray: any) => string,
  getMaxNorm: (VtkDataArray) => number,
};

// ----------------------------------------------------------------------------
// vtkDataArray methods
// ----------------------------------------------------------------------------

interface VtkDataArray {
  getElementComponentSize: () => number;
  getComponent: (tupleIdx: number, componentIndex: number = 0) => number;
  setComponent: (tupleIdx: number, componentIndex: number, value: number) => void;
  getData: () => Array<number>;
  getRange: (componentIndex: number = -1) => VtkRange;
  setRange: (rangeValue: VtkRange, componentIndex: number) => [number, number];
  setTuple: (idx: number, tuple: Array<number>) => void;
  getTuple: (idx: number, tupleToFill: Array<number> = []) => Array<number>;
  getTupleLocation: (idx: number = 1) => number;
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

export function extend(publicAPI: object, model: object, initialValues: object = {}): void;

// ----------------------------------------------------------------------------

export function newInstance(initialValues?: object): VtkObject | VtkDataArray;

// ----------------------------------------------------------------------------

enum DataTypeByteSize {
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

enum VtkDataTypes {
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
  ...STATIC,
  DataTypeByteSize,
  VtkDataTypes,
  DefaultDataType: VtkDataTypes,
};

