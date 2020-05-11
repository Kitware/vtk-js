export default function createMethods(session: any): {
    subscribeToImageStream: (callback: any) => any;
    unsubscribeToImageStream: (subscription: any) => any;
    registerView: (viewId: any) => any;
    unregisterView: (viewId: any) => any;
    enableView: (viewId: any, enabled: any) => any;
    render: (options?: {
        size: number[];
        view: number;
    }) => any;
    invalidateCache: (viewId: any) => any;
    setQuality: (viewId: any, quality: any, ratio?: number) => any;
    setSize: (viewId: any, width?: number, height?: number) => any;
    setServerAnimationFPS: (fps?: number) => any;
    getServerAnimationFPS: () => any;
    startAnimation: (viewId?: number) => any;
    stopAnimation: (viewId?: number) => any;
    updateCamera: (viewId?: number, focalPoint: any, viewUp: any, position: any, forceUpdate?: boolean) => any;
    updateCameraParameters: (viewId?: number, parameters?: {}, forceUpdate?: boolean) => any;
};
