export interface T100 {
  width: number;
  height: number;
}
declare function getVRHeadset(): Promise<any>;
export interface T101 {
  isMobile: boolean;
  isIOS: boolean;
  isWebViewAndroid: boolean;
  isSafari: boolean;
  isFirefoxAndroid: boolean;
  hardware: T100;
  getVRHeadset: typeof getVRHeadset;
}
declare const T102: T101;
export default T102;
