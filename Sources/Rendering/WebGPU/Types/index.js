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

function getByteStrideFromBufferFormat(format) {
  if (!format) return 0;
  let numComp = 1;
  if (format.substring(format.length - 2) === 'x4') numComp = 4;
  if (format.substring(format.length - 2) === 'x3') numComp = 3;
  if (format.substring(format.length - 2) === 'x2') numComp = 2;

  let typeSize = 4;
  if (numComp > 1) {
    if (format.substring(format.length - 3, format.length - 1) === '8x') {
      typeSize = 1;
    }
    if (format.substring(format.length - 4, format.length - 1) === '16x') {
      typeSize = 2;
    }
  } else {
    if (format.substring(format.length - 1) === '8') typeSize = 1;
    if (format.substring(format.length - 2) === '16') typeSize = 2;
  }
  return numComp * typeSize;
}

function getNativeTypeFromBufferFormat(format) {
  if (!format) return null;
  if (format.substring(0, 7) === 'float32') return 'Float32Array';
  if (format.substring(0, 6) === 'snorm8') return 'Int8Array';
  if (format.substring(0, 6) === 'unorm8') return 'Uint8Array';
  return '';
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
  if (!format) return null;
  let type = format.substring(format.length - 3, format.length);
  if (format[format.length - 1] === '>') {
    type = format.substring(format.length - 4, format.length - 1);
  }
  if (type === 'f32') return 'Float32Array';
  if (type === 'i32') return 'Int32Array';
  if (type === 'u32') return 'Uint32Array';
  return '';
}

export default {
  getByteStrideFromBufferFormat,
  getNativeTypeFromBufferFormat,
  getByteStrideFromShaderFormat,
  getNativeTypeFromShaderFormat,
};
