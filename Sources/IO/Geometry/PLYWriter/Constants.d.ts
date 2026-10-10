export declare const FormatTypes: {
  readonly ASCII: 'ascii';
  readonly BINARY: 'binary';
};

export type FormatTypes = (typeof FormatTypes)[keyof typeof FormatTypes];

/**
 * Choose the name used for the texture coordinates.
 * (u, v) or (texture_u, texture_v)
 */
export declare const TextureCoordinatesName: {
  readonly UV: [string, string];
  readonly TEXTURE_UV: [string, string];
};

export type TextureCoordinatesName =
  (typeof TextureCoordinatesName)[keyof typeof TextureCoordinatesName];

declare const _default: {
  FormatTypes: typeof FormatTypes;
  TextureCoordinatesName: typeof TextureCoordinatesName;
};
export default _default;
