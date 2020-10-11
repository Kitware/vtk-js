declare function toNativeType(str: any): any;
export interface T100 {
  [key: string]: any;
}
declare function extractURLParameters(castToNativeType?: boolean, query?: string): T100;
export interface T101 {
  toNativeType: typeof toNativeType;
  extractURLParameters: typeof extractURLParameters;
}
declare const T102: T101;
export default T102;
