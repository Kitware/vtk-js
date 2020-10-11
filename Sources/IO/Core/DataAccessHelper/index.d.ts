export interface T100 {
  [key: string]: any;
}
declare function get(type?: string, options?: T100): any;
export interface T101 {
  get: typeof get;
}
declare const T102: T101;
export default T102;
