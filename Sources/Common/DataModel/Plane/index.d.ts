export function vtkPlane(publicAPI: any, model: any): void;
export function extend(publicAPI: any, model: any, initialValues?: {}): void;
export namespace STATIC {
    export { evaluate };
    export { distanceToPlane };
    export { projectPoint };
    export { projectVector };
    export { generalizedProjectPoint };
    export { intersectWithLine };
    export { intersectWithPlane };
    export { DISJOINT };
    export { COINCIDE };
}
export const newInstance: any;
declare var _default: any;
export default _default;
declare function evaluate(normal: any, origin: any, x: any): number;
declare function distanceToPlane(x: any, origin: any, normal: any): number;
declare function projectPoint(x: any, origin: any, normal: any, xproj: any): void;
declare function projectVector(v: any, normal: any, vproj: any): void;
declare function generalizedProjectPoint(x: any, origin: any, normal: any, xproj: any): void;
declare function intersectWithLine(p1: any, p2: any, origin: any, normal: any): {
    intersection: boolean;
    betweenPoints: boolean;
    t: number;
    x: any[];
};
declare function intersectWithPlane(plane1Origin: any, plane1Normal: any, plane2Origin: any, plane2Normal: any): {
    intersection: boolean;
    l0: any[];
    l1: any[];
    error: any;
};
declare const DISJOINT: "disjoint";
declare const COINCIDE: "coincide";
