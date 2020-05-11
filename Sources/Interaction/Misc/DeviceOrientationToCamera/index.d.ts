declare namespace _default {
    export { addCameraToSynchronize };
    export { addWindowListeners };
    export { isDeviceOrientationSupported };
    export { removeCameraToSynchronize };
    export { removeWindowListeners };
}
export default _default;
declare function addCameraToSynchronize(renderWindowInteractor: any, camera: any, onCameraUpdate: any): number;
declare function addWindowListeners(): void;
declare function isDeviceOrientationSupported(): boolean;
declare function removeCameraToSynchronize(id: any, cancelAnimation?: boolean): void;
declare function removeWindowListeners(): void;
