export const VTK_BYTE_SIZE = {
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

export const VTK_DATATYPES = {
  CHAR: 'Int8Array',
  SIGNED_CHAR: 'Int8Array',
  UNSIGNED_CHAR: 'Uint8ClampedArray',
  SHORT: 'Int16Array',
  UNSIGNED_SHORT: 'Uint16Array',
  INT: 'Int32Array',
  UNSIGNED_INT: 'Uint32Array',
  FLOAT: 'Float32Array',
  DOUBLE: 'Float64Array',
};

export const VTK_DEFAULT_DATATYPE = 'Float32Array';

export default {
  VTK_DEFAULT_DATATYPE,
  VTK_BYTE_SIZE,
  VTK_DATATYPES,
};
