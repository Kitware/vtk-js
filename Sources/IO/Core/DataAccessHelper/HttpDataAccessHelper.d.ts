export interface T100 {
  [key: string]: any;
}
declare function fetchArray(instance?: T100, baseURL: any, array: any, options?: T100): Promise<any>;
declare function fetchJSON(instance?: T100, url: any, options?: T100): Promise<any>;
declare function fetchText(instance?: T100, url: any, options?: T100): Promise<any>;
declare function fetchBinary(url: any, options?: T100): Promise<any>;
declare function fetchImage(instance?: T100, url: any, options?: T100): Promise<any>;
export interface T101 {
  fetchArray: typeof fetchArray;
  fetchJSON: typeof fetchJSON;
  fetchText: typeof fetchText;
  fetchBinary: typeof fetchBinary;
  fetchImage: typeof fetchImage;
}
declare const T102: T101;
export default T102;
