declare function pushMonitorGLContextCount_1(cb: any): void;
export const pushMonitorGLContextCount: typeof pushMonitorGLContextCount_1;
declare function popMonitorGLContextCount_1(cb: any): any;
export const popMonitorGLContextCount: typeof popMonitorGLContextCount_1;
export interface T100 {
  [key: string]: any;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T100): void;
export const extend: typeof extend_1;
export const newInstance: any;
export interface T101 {
  newInstance: any;
  extend: typeof extend_1;
  pushMonitorGLContextCount: typeof pushMonitorGLContextCount_1;
  popMonitorGLContextCount: typeof popMonitorGLContextCount_1;
}
declare const T102: T101;
export default T102;
