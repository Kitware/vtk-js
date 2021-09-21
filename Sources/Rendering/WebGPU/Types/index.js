import { vtkErrorMacro } from 'vtk.js/Sources/macros';

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

// see https://gpuweb.github.io/gpuweb/#texture-formats
// for possible formats, there are a lot of them
const textureDetails = {
  // 8-bit formats
  r8unorm: {
    numComponents: 1,
    nativeType: Uint8Array,
    stride: 1,
    elementSize: 1,
    sampleType: 'float',
  },
  r8snorm: {
    numComponents: 1,
    nativeType: Int8Array,
    stride: 1,
    elementSize: 1,
    sampleType: 'float',
  },
  r8uint: {
    numComponents: 1,
    nativeType: Uint8Array,
    stride: 1,
    elementSize: 1,
    sampleType: 'uint',
  },
  r8sint: {
    numComponents: 1,
    nativeType: Int8Array,
    stride: 1,
    elementSize: 1,
    sampleType: 'sint',
  },

  // 16-bit formats
  r16uint: {
    numComponents: 1,
    nativeType: Uint16Array,
    stride: 2,
    elementSize: 2,
    sampleType: 'uint',
  },
  r16sint: {
    numComponents: 1,
    nativeType: Int16Array,
    stride: 2,
    elementSize: 2,
    sampleType: 'sint',
  },
  r16float: {
    numComponents: 1,
    nativeType: Float32Array,
    stride: 2,
    elementSize: 2,
    sampleType: 'float',
  },
  rg8unorm: {
    numComponents: 2,
    nativeType: Uint8Array,
    stride: 2,
    elementSize: 1,
    sampleType: 'float',
  },
  rg8snorm: {
    numComponents: 2,
    nativeType: Int8Array,
    stride: 2,
    elementSize: 1,
    sampleType: 'float',
  },
  rg8uint: {
    numComponents: 2,
    nativeType: Uint8Array,
    stride: 2,
    elementSize: 1,
    sampleType: 'uint',
  },
  rg8sint: {
    numComponents: 2,
    nativeType: Int8Array,
    stride: 2,
    elementSize: 1,
    sampleType: 'sint',
  },

  // 32-bit formats
  r32uint: {
    numComponents: 1,
    nativeType: Uint32Array,
    stride: 4,
    elementSize: 4,
    sampleType: 'uint',
  },
  r32sint: {
    numComponents: 1,
    nativeType: Int32Array,
    stride: 4,
    elementSize: 4,
    sampleType: 'sint',
  },
  r32float: {
    numComponents: 1,
    nativeType: Float32Array,
    stride: 4,
    elementSize: 4,
    sampleType: 'unfilterable-float',
  },
  rg16uint: {
    numComponents: 2,
    nativeType: Uint16Array,
    stride: 4,
    elementSize: 2,
    sampleType: 'uint',
  },
  rg16sint: {
    numComponents: 2,
    nativeType: Int16Array,
    stride: 4,
    elementSize: 2,
    sampleType: 'sint',
  },
  rg16float: {
    numComponents: 2,
    nativeType: Float32Array,
    stride: 4,
    elementSize: 2,
    sampleType: 'float',
  },
  rgba8unorm: {
    numComponents: 4,
    nativeType: Uint8Array,
    stride: 4,
    elementSize: 1,
    sampleType: 'float',
  },
  'rgba8unorm-srgb': {
    numComponents: 4,
    nativeType: Uint8Array,
    stride: 4,
    elementSize: 1,
    sampleType: 'float',
  },
  rgba8snorm: {
    numComponents: 4,
    nativeType: Int8Array,
    stride: 4,
    elementSize: 1,
    sampleType: 'float',
  },
  rgba8uint: {
    numComponents: 4,
    nativeType: Uint8Array,
    stride: 4,
    elementSize: 1,
    sampleType: 'uint',
  },
  rgba8sint: {
    numComponents: 4,
    nativeType: Int8Array,
    stride: 4,
    elementSize: 1,
    sampleType: 'sint',
  },
  bgra8unorm: {
    numComponents: 4,
    nativeType: Uint8Array,
    stride: 4,
    elementSize: 1,
    sampleType: 'float',
  },
  'bgra8unorm-srgb': {
    numComponents: 4,
    nativeType: Uint8Array,
    stride: 4,
    elementSize: 1,
    sampleType: 'float',
  },
  // Packed 32-bit formats
  rgb9e5ufloat: {
    numComponents: 4,
    nativeType: Uint32Array,
    stride: 4,
    sampleType: 'float',
  },
  rgb10a2unorm: {
    numComponents: 4,
    nativeType: Uint32Array,
    stride: 4,
    sampleType: 'float',
  },
  rg11b10ufloat: {
    numComponents: 4,
    nativeType: Float32Array,
    stride: 4,
    sampleType: 'float',
  },

  // 64-bit formats
  rg32uint: {
    numComponents: 2,
    nativeType: Uint32Array,
    stride: 8,
    elementSize: 4,
    sampleType: 'uint',
  },
  rg32sint: {
    numComponents: 2,
    nativeType: Int32Array,
    stride: 8,
    elementSize: 4,
    sampleType: 'sint',
  },
  rg32float: {
    numComponents: 2,
    nativeType: Float32Array,
    stride: 8,
    elementSize: 4,
    sampleType: 'unfilterable-float',
  },
  rgba16uint: {
    numComponents: 4,
    nativeType: Uint16Array,
    stride: 8,
    elementSize: 2,
    sampleType: 'uint',
  },
  rgba16sint: {
    numComponents: 4,
    nativeType: Int16Array,
    stride: 8,
    elementSize: 2,
    sampleType: 'sint',
  },
  rgba16float: {
    numComponents: 4,
    nativeType: Float32Array,
    stride: 8,
    elementSize: 2,
    sampleType: 'float',
  },

  // 128-bit formats
  rgba32uint: {
    numComponents: 4,
    nativeType: Uint32Array,
    stride: 16,
    elementSize: 4,
    sampleType: 'uint',
  },
  rgba32sint: {
    numComponents: 4,
    nativeType: Int32Array,
    stride: 16,
    elementSize: 4,
    sampleType: 'sint',
  },
  rgba32float: {
    numComponents: 4,
    nativeType: Float32Array,
    stride: 16,
    elementSize: 4,
    sampleType: 'unfilterable-float',
  },

  // Depth and stencil formats
  stencil8: {
    numComponents: 1,
    nativeType: Uint8Array,
    stride: 1,
    elementSize: 1,
    sampleType: 'uint',
  },
  depth16unorm: {
    numComponents: 1,
    nativeType: Uint16Array,
    stride: 2,
    elementSize: 2,
    sampleType: 'depth',
  },
  depth24plus: {
    numComponents: 1,
    nativeType: Uint32Array,
    stride: 4,
    elementSize: 3,
    sampleType: 'depth',
  },
  'depth24plus-stencil8': {
    numComponents: 2,
    nativeType: Uint32Array,
    stride: 4,
    sampleType: 'mixed',
  },
  depth32float: {
    numComponents: 1,
    nativeType: Float32Array,
    stride: 4,
    elementSize: 4,
    sampleType: 'depth',
  },
};

function getDetailsFromTextureFormat(format) {
  if (!format || format.length < 6) return 0;

  if (format in textureDetails === true) {
    return textureDetails[format];
  }
  vtkErrorMacro(`unknown format ${format}`);
  return null;
}

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
function getNumberOfComponentsFromBufferFormat(format) {
  if (!format || format.length < 5) return 0;

  // options are x2, x3, x4 or nothing
  let numComp = 1;
  if (format[format.length - 2] === 'x') {
    numComp = format[format.length - 1];
  }
  return numComp;
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

function getShaderTypeFromBufferFormat(format) {
  let dataType;
  if (format[0] === 'f' || format[1] === 'n') {
    dataType = 'f32';
  } else if (format[0] === 's' && format[1] === 'i') {
    dataType = 'i32';
  } else if (format[0] === 'u' && format[1] === 'i') {
    dataType = 'u32';
  } else {
    vtkErrorMacro(`unknown format ${format}`);
    return undefined;
  }

  // options are x2, x3, x4 or nothing
  let numComp = 1;
  if (format[format.length - 2] === 'x') {
    numComp = Number(format[format.length - 1]);
  }
  if (numComp === 4) return `vec4<${dataType}>`;
  if (numComp === 3) return `vec3<${dataType}>`;
  if (numComp === 2) return `vec2<${dataType}>`;
  return dataType;
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
  getDetailsFromTextureFormat,
  getByteStrideFromBufferFormat,
  getNumberOfComponentsFromBufferFormat,
  getNativeTypeFromBufferFormat,
  getShaderTypeFromBufferFormat,
  getByteStrideFromShaderFormat,
  getNativeTypeFromShaderFormat,
};
