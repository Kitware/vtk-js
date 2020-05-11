declare namespace _default {
    export { create };
}
export default _default;
declare function create(createOptions: any): {
    fetchArray(instance?: {}, baseURL: any, array: any, options?: {}): any;
    fetchJSON(instance?: {}, url: any, options?: {}): any;
    fetchText(instance?: {}, url: any, options?: {}): any;
    fetchImage(instance?: {}, url: any, options?: {}): any;
    fetchBinary(instance?: {}, url: any, options?: {}): any;
};
