export function extend(publicAPI: any, model: any, initialValues?: {}): void;
export namespace STATIC {
    export { applyGaussianToPiecewiseFunction };
    export { computeOpacities };
    export { createListener };
    export { drawChart };
    export { findGaussian };
    export { listenerSelector };
    export { normalizeCoordinates };
}
export const newInstance: any;
declare var _default: any;
export default _default;
declare function applyGaussianToPiecewiseFunction(gaussians: any, sampling: any, rangeToUse: any, piecewiseFunction: any): void;
declare function computeOpacities(gaussians: any, sampling?: number): number[];
declare function createListener(callback: any, preventDefault?: boolean): (e: any) => void;
declare function drawChart(ctx: any, area: any, values: any, style?: {
    lineWidth: number;
    strokeStyle: string;
}): void;
declare function findGaussian(x: any, gaussians: any): any;
declare function listenerSelector(condition: any, ok: any, ko: any): (e: any) => any;
declare function normalizeCoordinates(x: any, y: any, subRectangeArea: any, zoomRange?: number[]): number[];
