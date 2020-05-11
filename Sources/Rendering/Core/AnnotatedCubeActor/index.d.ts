export function extend(publicAPI: any, model: any, initialValues?: {}): void;
export namespace DEFAULT_VALUES {
    export namespace defaultStyle {
        export const text: string;
        export const faceColor: string;
        export const faceRotation: number;
        export const fontFamily: string;
        export const fontColor: string;
        export const fontStyle: string;
        export function fontSizeScale(resolution: any): number;
        export const edgeThickness: number;
        export const edgeColor: string;
        export const resolution: number;
    }
}
export const newInstance: any;
declare namespace _default {
    export { newInstance };
    export { extend };
    export { Presets };
}
export default _default;
