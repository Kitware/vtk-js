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
    Gaussians: number;
    Points: number;
    Nodes: number;
};
declare const Defaults: {
    Gaussians: {
        position: number;
        height: number;
        width: number;
        xBias: number;
        yBias: number;
    }[];
    Points: number[][];
    Nodes: {
        x: number;
        y: number;
        midpoint: number;
        sharpness: number;
    }[];
};
