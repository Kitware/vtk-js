export const FormatTypes = {
  ASCII: 'ascii',
  BINARY: 'binary',
};

/**
 * Choose the name used for the texture coordinates.
 * (u, v) or (texture_u, texture_v)
 */
export const TextureCoordinatesName = {
  UV: ['u', 'v'],
  TEXTURE_UV: ['texture_u', 'texture_v'],
};

export default {
  FormatTypes,
  TextureCoordinatesName,
};
