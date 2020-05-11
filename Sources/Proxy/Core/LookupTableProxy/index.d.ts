export const newInstance: any;
declare namespace _default {
    export { newInstance };
    export { extend };
    export { Mode };
    export { Defaults };
}
export default _default;
declare function extend(publicAPI: any, model: any, initialValues?: {}): void;
declare const Mode: {
    Preset: number;
    RGBPoints: number;
    HSVPoints: number;
    Nodes: number;
};
declare const Defaults: {
    Preset: string;
    RGBPoints: number[][];
    HSVPoints: number[][];
    Nodes: {
        x: number;
        r: number;
        g: number;
        b: number;
        midpoint: number;
        sharpness: number;
    }[];
};
