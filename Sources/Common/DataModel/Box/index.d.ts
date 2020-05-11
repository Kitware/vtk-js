export function extend(publicAPI: any, model: any, initialValues?: {}): void;
export namespace STATIC {
    export { intersectBox };
    export { intersectPlane };
}
export const newInstance: any;
declare var _default: any;
export default _default;
declare function intersectBox(bounds: any, origin: any, dir: any, coord: any, tolerance: any): 1 | 0;
declare function intersectPlane(bounds: any, origin: any, normal: any): 1 | 0;
