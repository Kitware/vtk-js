export function vtkInterpolationMathFloor(x: any): {
    floored: number;
    error: number;
};
export function vtkInterpolationMathRound(x: any): number;
export function vtkInterpolationMathClamp(a: any, b: any, c: any): any;
export function vtkInterpolationMathWrap(a: any, b: any, c: any): number;
export function vtkInterpolationMathMirror(a: any, b: any, c: any): number;
export namespace vtkInterpolationInfo {
    export const pointer: any;
    export const extent: number[];
    export const increments: number[];
    export const scalarType: any;
    export const dataTypeSize: number;
    export const numberOfComponents: number;
    export const borderMode: number;
    export const interpolationMode: number;
    export const extraInfo: any;
}
export const vtkInterpolationWeights: any;
declare namespace _default {
    export { vtkInterpolationInfo };
    export { vtkInterpolationWeights };
    export { vtkInterpolationMathFloor };
    export { vtkInterpolationMathRound };
    export { vtkInterpolationMathClamp };
    export { vtkInterpolationMathWrap };
    export { vtkInterpolationMathMirror };
}
export default _default;
