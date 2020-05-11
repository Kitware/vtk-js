export function extend(publicAPI: any, model: any, initialValues?: {}): void;
export namespace STATIC {
    export { clipLineWithPlane };
}
export const newInstance: any;
declare var _default: any;
export default _default;
declare function clipLineWithPlane(mapper: any, matrix: any, p1: any, p2: any): 0 | {
    planeId: number;
    t1: number;
    t2: number;
    intersect: number;
};
