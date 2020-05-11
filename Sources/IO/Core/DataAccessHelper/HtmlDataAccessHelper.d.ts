declare namespace _default {
    export { fetchJSON };
    export { fetchText };
    export { fetchArray };
    export { fetchImage };
}
export default _default;
declare function fetchJSON(instance?: {}, url: any, options?: {}): any;
declare function fetchText(instance?: {}, url: any, options?: {}): any;
declare function fetchArray(instance?: {}, baseURL: any, array: any, options?: {}): any;
declare function fetchImage(instance?: {}, url: any, options?: {}): any;
