export function extend(publicAPI: any, model: any, initialValues?: {}): void;
export const newInstance: any;
declare namespace _default {
    export { newInstance };
    export { extend };
    export { updateConfiguration };
}
export default _default;
declare function updateConfiguration(dataset: any, dataArray: any, { mapper, property }: {
    mapper: any;
    property: any;
}): void;
