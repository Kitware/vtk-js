/**
 *
 * @param {Boolean} [castToNativeType]
 * @param {String} [query]
 */
declare function extractURLParameters(
  castToNativeType?: boolean,
  query?: string
): object;

/**
 *
 * @param {String} str The type value as string.
 */
declare function toNativeType(
  str: string
): string | number | boolean | null | undefined | unknown[];

declare const _default: {
  toNativeType: typeof toNativeType;
  extractURLParameters: typeof extractURLParameters;
};
export default _default;
