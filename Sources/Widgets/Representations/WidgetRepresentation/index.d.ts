export interface T100 {
  [key: string]: any;
}
export interface T101 {
  active: T100;
  inactive: T100;
  static: T100;
}
declare function mergeStyles_1(elementNames: any, ...stylesToMerge: any[]): T101;
export const mergeStyles: typeof mergeStyles_1;
declare function applyStyles_1(pipelines: any, styles: any, activeActor: any): void;
export const applyStyles: typeof applyStyles_1;
declare function connectPipeline_1(pipeline: any): void;
export const connectPipeline: typeof connectPipeline_1;
declare function extend_1(publicAPI: any, model: any, initialValues?: T100): void;
export const extend: typeof extend_1;
export interface T102 {
  extend: typeof extend_1;
  mergeStyles: typeof mergeStyles_1;
  applyStyles: typeof applyStyles_1;
  connectPipeline: typeof connectPipeline_1;
}
declare const T103: T102;
export default T103;
