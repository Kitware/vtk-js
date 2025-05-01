/**
 *
 * @param {Boolean} [castToNativeType]
 * @param {String} [query]
 */
export function extractURLParameters(
  castToNativeType?: boolean,
  query?: string
): object;

/**
 *
 * @param {String} str The type value as string.
 */
export function toNativeType(str: string): void;

declare const _default: {
  toNativeType: typeof toNativeType;
  extractURLParameters: typeof extractURLParameters;
};
export default _default;
