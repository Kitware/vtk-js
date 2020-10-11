export interface T100 {
  [key: string]: any;
}
export interface T101 {
  fetchArray(instance: T100, baseURL: any, array: any, options?: T100): Promise<any>;
  fetchJSON(instance: T100, url: any, options?: T100): any;
  fetchText(instance: T100, url: any, options?: T100): any;
  fetchImage(instance: T100, url: any, options?: T100): Promise<any>;
  fetchBinary(instance: T100, url: any, options?: T100): any;
}
declare function create(createOptions: any): T101;
export interface T102 {
  create: typeof create;
}
declare const T103: T102;
export default T103;
