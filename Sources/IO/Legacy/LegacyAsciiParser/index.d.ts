export interface T100 {
  [key: string]: any;
}
declare function parseLegacyASCII(content: any, dataModel?: T100): T100;
export interface T101 {
  parseLegacyASCII: typeof parseLegacyASCII;
}
declare const T102: T101;
export default T102;
