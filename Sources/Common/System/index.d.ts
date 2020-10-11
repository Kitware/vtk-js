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
declare function getUniversalTime(): number;
export interface T102 {
  getUniversalTime: typeof getUniversalTime;
}
export interface T103 {
  vtkMobileVR: T101;
  vtkTimerLog: T102;
}
declare const T104: T103;
export default T104;
