export declare const FormatTypes: {
  readonly ASCII: 'ascii';
  readonly BINARY: 'binary';
  readonly APPENDED: 'appended';
};

export type FormatTypes = (typeof FormatTypes)[keyof typeof FormatTypes];

/**
 * Mapping from a JavaScript typed array constructor name to the corresponding
 * VTK XML data array type name.
 */
export declare const TYPED_ARRAY: Record<string, string>;

declare const _default: {
  FormatTypes: typeof FormatTypes;
};
export default _default;
