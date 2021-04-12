import { vtkErrorMacro } from 'vtk.js/Sources/macro';

// ----------------------------------------------------------------------------
// vtkWebGPUDevice static functions
//
// WebGPU uses types in a many places and calls, and often those types
// need to be associated with byte sizes, alignments, native arrays etc.
// The folowing methods are designed to help vtk.js introspect those types.
// WebGPU currently tends to use multiple type formats:
//  - buffer types such as float32x4
//  - shader types suchs as vec4<f32>
//  - texture types such as rgba32float
// ----------------------------------------------------------------------------

// see https://gpuweb.github.io/gpuweb/#enumdef-gpuvertexformat
// for possible formats
function getByteStrideFromBufferFormat(format) {
  if (!format || format.length < 5) return 0;

  // options are x2, x3, x4 or nothing
  let numComp = 1;
  if (format[format.length - 2] === 'x') {
    numComp = format[format.length - 1];
  }

  const sizeStart = numComp === 1 ? format.length - 1 : format.length - 3;
  // options are 8, 16, 32 resulting in 8, 6, 2 as the last char
  // plugged into the formula below gives 1, 2, 4 respectively
  const num = Number(format[sizeStart]);
  if (Number.isNaN(num)) {
    vtkErrorMacro(`unknown format ${format}`);
    return 0;
  }
  const typeSize = 5 - num / 2;
  return numComp * typeSize;
}

// see https://gpuweb.github.io/gpuweb/#enumdef-gpuvertexformat
// for possible formats
function getNativeTypeFromBufferFormat(format) {
  if (!format || format.length < 5) return 0;

  // raw types are Uint Int or Float as follows
  let result;
  if (format[0] === 'f') {
    result = 'Float';
  } else if (format[0] === 's') {
    result = 'Int';
  } else if (format[0] === 'u') {
    result = 'Uint';
  } else {
    vtkErrorMacro(`unknown format ${format}`);
    return undefined;
  }

  // options are 8, 16, 32 resulting in 8, 6, 2 as the last char
  // plugged into the formula below gives 1, 2, 4 respectively
  const base = format.split('x')[0];
  const num = Number(base[base.length - 1]);
  if (Number.isNaN(num)) {
    vtkErrorMacro(`unknown format ${format}`);
    return undefined;
  }
  result += 8 * (5 - num / 2);
  result += 'Array';

  return result;
}

function getByteStrideFromShaderFormat(format) {
  if (!format) return 0;
  let numComp = 1;

  if (format.substring(0, 3) === 'vec') {
    numComp = format[3];
  } else if (format.substring(0, 3) === 'mat') {
    numComp = format[3] * format[5];
  }

  const typeSize = 4;
  return numComp * typeSize;
}

function getNativeTypeFromShaderFormat(format) {
  if (!format) return undefined;
  if (format.includes('f32')) return 'Float32Array';
  if (format.includes('i32')) return 'Int32Array';
  if (format.includes('u32')) return 'Uint32Array';
  vtkErrorMacro(`unknown format ${format}`);
  return undefined;
}

export default {
  getByteStrideFromBufferFormat,
  getNativeTypeFromBufferFormat,
  getByteStrideFromShaderFormat,
  getNativeTypeFromShaderFormat,
};
