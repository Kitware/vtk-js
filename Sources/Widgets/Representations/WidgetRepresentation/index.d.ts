export function mergeStyles(elementNames: any, ...stylesToMerge: any[]): {
    active: {};
    inactive: {};
    static: {};
};
export function applyStyles(pipelines: any, styles: any, activeActor: any): void;
export function connectPipeline(pipeline: any): void;
export function extend(publicAPI: any, model: any, initialValues?: {}): void;
declare namespace _default {
    export { extend };
    export { mergeStyles };
    export { applyStyles };
    export { connectPipeline };
}
export default _default;
