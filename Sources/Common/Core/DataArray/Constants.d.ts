export declare const DataTypeByteSize: {
  Int8Array: number;
  Uint8Array: number;
  Uint8ClampedArray: number;
  Int16Array: number;
  Uint16Array: number;
  Int32Array: number;
  Uint32Array: number;
  Float32Array: number;
  Float64Array: number;
};

/**
 * Constants capturing the various VTK data types.
 */
export declare const VtkDataTypes: {
  readonly VOID: '';
  readonly CHAR: 'Int8Array';
  readonly SIGNED_CHAR: 'Int8Array';
  readonly UNSIGNED_CHAR: 'Uint8Array';
  /**
   * Should be used for VTK.js internal purpose only
   */
  readonly UNSIGNED_CHAR_CLAMPED: 'Uint8ClampedArray';
  readonly SHORT: 'Int16Array';
  readonly UNSIGNED_SHORT: 'Uint16Array';
  readonly INT: 'Int32Array';
  readonly UNSIGNED_INT: 'Uint32Array';
  readonly FLOAT: 'Float32Array';
  readonly DOUBLE: 'Float64Array';
};

export type VtkDataTypes = (typeof VtkDataTypes)[keyof typeof VtkDataTypes];

export declare const DefaultDataType: VtkDataTypes;

declare const _default: {
  DefaultDataType: typeof DefaultDataType;
  DataTypeByteSize: typeof DataTypeByteSize;
  VtkDataTypes: typeof VtkDataTypes;
};
export default _default;
