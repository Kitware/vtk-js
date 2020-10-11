declare function addCameraToSynchronize(renderWindowInteractor: any, camera: any, onCameraUpdate: any): number;
declare function addWindowListeners(): void;
declare function isDeviceOrientationSupported(): boolean;
declare function removeCameraToSynchronize(id: any, cancelAnimation?: boolean): void;
declare function removeWindowListeners(): void;
export interface T100 {
  addCameraToSynchronize: typeof addCameraToSynchronize;
  addWindowListeners: typeof addWindowListeners;
  isDeviceOrientationSupported: typeof isDeviceOrientationSupported;
  removeCameraToSynchronize: typeof removeCameraToSynchronize;
  removeWindowListeners: typeof removeWindowListeners;
}
declare const T101: T100;
export default T101;
