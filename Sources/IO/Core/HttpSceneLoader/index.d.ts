export function extend(publicAPI: any, model: any, initialValues?: {}): void;
export const newInstance: any;
declare namespace _default {
    export { newInstance };
    export { extend };
    export { applySettings };
    export { updateDatasetTypeMapping };
}
export default _default;
declare function applySettings(sceneItem: any, settings: any): void;
declare function updateDatasetTypeMapping(typeName: any, handler: any): void;
