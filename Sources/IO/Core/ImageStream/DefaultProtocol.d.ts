export interface T100 {
  size: number[];
  view: number;
}
export interface T101 {
  [key: string]: any;
}
export interface T102 {
  subscribeToImageStream: (callback: any) => any;
  unsubscribeToImageStream: (subscription: any) => any;
  registerView: (viewId: any) => any;
  unregisterView: (viewId: any) => any;
  enableView: (viewId: any, enabled: any) => any;
  render: (options?: T100) => any;
  invalidateCache: (viewId: any) => any;
  setQuality: (viewId: any, quality: any, ratio?: number) => any;
  setSize: (viewId: any, width?: number, height?: number) => any;
  setServerAnimationFPS: (fps?: number) => any;
  getServerAnimationFPS: () => any;
  startAnimation: (viewId?: number) => any;
  stopAnimation: (viewId?: number) => any;
  updateCamera: (viewId: number, focalPoint: any, viewUp: any, position: any, forceUpdate?: boolean) => any;
  updateCameraParameters: (viewId?: number, parameters?: T101, forceUpdate?: boolean) => any;
}
export default function createMethods(session: any): T102;
