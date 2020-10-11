declare function loadScript_1(url: any): Promise<any>;
export const loadScript: typeof loadScript_1;
declare function loadCSS_1(url: any): Promise<any>;
export const loadCSS: typeof loadCSS_1;
export interface T100 {
  loadScript: typeof loadScript_1;
  loadCSS: typeof loadCSS_1;
  LOADED_URLS: any[];
}
declare const T101: T100;
export default T101;
