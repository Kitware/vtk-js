declare function getEndianness_1(): string | string;
export const getEndianness: typeof getEndianness_1;
export const ENDIANNESS: string | string;
declare function swapBytes_1(buffer: any, wordSize: any): void;
export const swapBytes: typeof swapBytes_1;
export interface T100 {
  ENDIANNESS: string;
  getEndianness: typeof getEndianness_1;
  swapBytes: typeof swapBytes_1;
}
declare const T101: T100;
export default T101;
