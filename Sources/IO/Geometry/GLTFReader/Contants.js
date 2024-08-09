/* eslint-disable no-underscore-dangle */
export const BINARY_HEADER_MAGIC = 'glTF';

export const COMPONENTS = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16,
};

export const BYTES = {
  5120: 1, // BYTE
  5121: 1, // UNSIGNED_BYTE
  5122: 2, // SHORT
  5123: 2, // UNSIGNED_SHORT
  5125: 4, // UNSIGNED_INT
  5126: 4, // FLOAT
};

export const MODES = {
  GL_POINTS: 0,
  GL_LINES: 1,
  GL_LINE_LOOP: 2,
  GL_LINE_STRIP: 3,
  GL_TRIANGLES: 4,
  GL_TRIANGLE_STRIP: 5,
  GL_TRIANGLE_FAN: 6,
};

export const ARRAY_TYPES = {
  5120: Int8Array,
  5121: Uint8Array,
  5122: Int16Array,
  5123: Uint16Array,
  5125: Uint32Array,
  5126: Float32Array,
};

const GL_SAMPLER = {
  // Sampler parameters
  TEXTURE_MAG_FILTER: 0x2800,
  TEXTURE_MIN_FILTER: 0x2801,
  TEXTURE_WRAP_S: 0x2802,
  TEXTURE_WRAP_T: 0x2803,
};

export const DEFAULT_SAMPLER = {
  [GL_SAMPLER.TEXTURE_MAG_FILTER]: GL_SAMPLER.LINEAR,
  [GL_SAMPLER.TEXTURE_MIN_FILTER]: GL_SAMPLER.NEAREST_MIPMAP_LINEAR,
  [GL_SAMPLER.TEXTURE_WRAP_S]: GL_SAMPLER.REPEAT,
  [GL_SAMPLER.TEXTURE_WRAP_]: GL_SAMPLER.REPEAT,
};

export const semanticAttributeMap = {
  NORMAL: 'normal',
  POSITION: 'position',
  TEXCOORD_0: 'texcoord0',
  TEXCOORD_1: 'texcoord1',
  WEIGHTS_0: 'weight',
  JOINTS_0: 'joint',
  COLOR_0: 'color',
};
