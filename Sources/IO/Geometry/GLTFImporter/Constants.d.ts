export declare const BINARY_HEADER_MAGIC: 'glTF';
export declare const BINARY_HEADER_LENGTH: 12;

export declare const BINARY_CHUNK_TYPES: {
  readonly JSON: 0x4e4f534a;
  readonly BIN: 0x004e4942;
};

export type BINARY_CHUNK_TYPES =
  (typeof BINARY_CHUNK_TYPES)[keyof typeof BINARY_CHUNK_TYPES];

export declare const BINARY_HEADER_INTS: 3;
export declare const BINARY_CHUNK_HEADER_INTS: 2;

export declare const MIN_LIGHT_ATTENUATION: number;

export declare const COMPONENTS: {
  readonly SCALAR: 1;
  readonly VEC2: 2;
  readonly VEC3: 3;
  readonly VEC4: 4;
  readonly MAT2: 4;
  readonly MAT3: 9;
  readonly MAT4: 16;
};

export declare const BYTES: {
  readonly 5120: 1;
  readonly 5121: 1;
  readonly 5122: 2;
  readonly 5123: 2;
  readonly 5125: 4;
  readonly 5126: 4;
};

export declare const MODES: {
  readonly GL_POINTS: 0;
  readonly GL_LINES: 1;
  readonly GL_LINE_LOOP: 2;
  readonly GL_LINE_STRIP: 3;
  readonly GL_TRIANGLES: 4;
  readonly GL_TRIANGLE_STRIP: 5;
  readonly GL_TRIANGLE_FAN: 6;
};

export type MODES = (typeof MODES)[keyof typeof MODES];

export declare const ARRAY_TYPES: {
  readonly 5120: typeof Int8Array;
  readonly 5121: typeof Uint8Array;
  readonly 5122: typeof Int16Array;
  readonly 5123: typeof Uint16Array;
  readonly 5125: typeof Uint32Array;
  readonly 5126: typeof Float32Array;
};

export declare const GL_SAMPLER: {
  readonly NEAREST: 9728;
  readonly LINEAR: 9729;
  readonly NEAREST_MIPMAP_NEAREST: 9984;
  readonly LINEAR_MIPMAP_NEAREST: 9985;
  readonly NEAREST_MIPMAP_LINEAR: 9986;
  readonly LINEAR_MIPMAP_LINEAR: 9987;
  readonly REPEAT: 10497;
  readonly CLAMP_TO_EDGE: 33071;
  readonly MIRRORED_REPEAT: 33648;
  readonly TEXTURE_MAG_FILTER: 10240;
  readonly TEXTURE_MIN_FILTER: 10241;
  readonly TEXTURE_WRAP_S: 10242;
  readonly TEXTURE_WRAP_T: 10243;
};

export type GL_SAMPLER = (typeof GL_SAMPLER)[keyof typeof GL_SAMPLER];

export declare const DEFAULT_SAMPLER: {
  readonly magFilter: typeof GL_SAMPLER.NEAREST;
  readonly minFilter: typeof GL_SAMPLER.LINEAR_MIPMAP_LINEAR;
  readonly wrapS: typeof GL_SAMPLER.REPEAT;
  readonly wrapT: typeof GL_SAMPLER.REPEAT;
};

export declare const SEMANTIC_ATTRIBUTE_MAP: {
  readonly NORMAL: 'normal';
  readonly POSITION: 'position';
  readonly TEXCOORD_0: 'texcoord0';
  readonly TEXCOORD_1: 'texcoord1';
  readonly WEIGHTS_0: 'weight';
  readonly JOINTS_0: 'joint';
  readonly COLOR_0: 'color';
  readonly TANGENT: 'tangent';
};

export declare const ALPHA_MODE: {
  readonly OPAQUE: 'OPAQUE';
  readonly MASK: 'MASK';
  readonly BLEND: 'BLEND';
};

export type ALPHA_MODE = (typeof ALPHA_MODE)[keyof typeof ALPHA_MODE];
