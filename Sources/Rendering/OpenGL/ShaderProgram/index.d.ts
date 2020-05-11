declare namespace _default {
    export { newInstance };
    export { extend };
    export { substitute };
}
export default _default;
declare const newInstance: any;
declare function extend(publicAPI: any, model: any, initialValues?: {}): void;
declare function substitute(source: any, search: any, replace: any, all?: boolean): {
    replace: boolean;
    result: any;
};
