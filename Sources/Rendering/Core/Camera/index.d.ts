export function extend(publicAPI: any, model: any, initialValues?: {}): void;
export namespace DEFAULT_VALUES {
    export const position: number[];
    export const focalPoint: number[];
    export const viewUp: number[];
    export const directionOfProjection: number[];
    export const parallelProjection: boolean;
    export const useHorizontalViewAngle: boolean;
    export const viewAngle: number;
    export const parallelScale: number;
    export const clippingRange: number[];
    export const windowCenter: number[];
    export const viewPlaneNormal: number[];
    export const useOffAxisProjection: boolean;
    export const screenBottomLeft: number[];
    export const screenBottomRight: number[];
    export const screenTopRight: number[];
    export const freezeFocalPoint: boolean;
    export const projectionMatrix: any;
    export const viewMatrix: any;
    export const physicalTranslation: number[];
    export const physicalScale: number;
    export const physicalViewUp: number[];
    export const physicalViewNorth: number[];
}
export const newInstance: any;
declare namespace _default {
    export { newInstance };
    export { extend };
}
export default _default;
