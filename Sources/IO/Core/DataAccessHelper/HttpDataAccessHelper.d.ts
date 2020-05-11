declare namespace _default {
    export { fetchArray };
    export { fetchJSON };
    export { fetchText };
    export { fetchBinary };
    export { fetchImage };
}
export default _default;
declare function fetchArray(instance?: {}, baseURL: any, array: any, options?: {}): any;
declare function fetchJSON(instance?: {}, url: any, options?: {}): any;
declare function fetchText(instance?: {}, url: any, options?: {}): any;
declare function fetchBinary(url: any, options?: {}): any;
declare function fetchImage(instance?: {}, url: any, options?: {}): any;
