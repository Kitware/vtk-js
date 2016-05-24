export const BYTE_SIZE = {
  Int8Array: 1,
  Uint8Array: 1,
  Uint8ClampedArray: 1,
  Int16Array: 2,
  Uint16Array: 2,
  Int32Array: 4,
  Uint32Array: 4,
  Float32Array: 4,
  Float64Array: 8,
};

export const DATATYPES = {
  VTK_CHAR: 'Int8Array',
  VTK_SIGNED_CHAR: 'Int8Array',
  VTK_UNSIGNED_CHAR: 'Uint8ClampedArray',
  VTK_SHORT: 'Int16Array',
  VTK_UNSIGNED_SHORT: 'Uint16Array',
  VTK_INT: 'Int32Array',
  VTK_UNSIGNED_INT: 'Uint32Array',
  VTK_FLOAT: 'Float32Array',
  VTK_DOUBLE: 'Float64Array',
};

export const DEFAULT_DATATYPE = 'Float32Array';

export default {
  DEFAULT_DATATYPE,
  BYTE_SIZE,
  DATATYPES,
};
