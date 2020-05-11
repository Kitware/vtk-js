export function extend(publicAPI: any, model: any, initialValues?: {}): void;
export namespace STATIC {
    export { dollyToPosition };
    export { translateCamera };
    export { dollyByFactor };
}
export const newInstance: any;
declare var _default: any;
export default _default;
declare function dollyToPosition(fact: any, position: any, renderer: any, rwi: any): void;
declare function translateCamera(renderer: any, rwi: any, toX: any, toY: any, fromX: any, fromY: any): void;
declare function dollyByFactor(interactor: any, renderer: any, factor: any): void;
