export declare const FormatTypes: {
  readonly ASCII: 'ascii';
  readonly BINARY: 'binary';
};

export type FormatTypes = (typeof FormatTypes)[keyof typeof FormatTypes];

declare const _default: {
  FormatTypes: typeof FormatTypes;
};
export default _default;
