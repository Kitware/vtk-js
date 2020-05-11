export function extend(publicAPI: any, model: any, initialValues?: {}): void;
export namespace STATIC {
    export { distanceToLine };
    export { intersection };
}
export const newInstance: any;
declare var _default: any;
export default _default;
declare function distanceToLine(x: any, p1: any, p2: any, closestPoint?: any): {
    t: number;
    distance: number;
};
declare function intersection(a1: any, a2: any, b1: any, b2: any, u: any, v: any): any;
