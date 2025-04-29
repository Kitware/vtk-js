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
  toNativeType(str: string): any;
  extractURLParameters(
    castToNativeType?: boolean,
    query?: string
  ): Record<string, any>;
};
export default _default;
