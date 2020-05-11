declare namespace _default {
    export { Defaults };
    export { Mode };
}
export default _default;
declare namespace Defaults {
    export const Gaussians: {
        position: number;
        height: number;
        width: number;
        xBias: number;
        yBias: number;
    }[];
    export const Points: number[][];
    export const Nodes: {
        x: number;
        y: number;
        midpoint: number;
        sharpness: number;
    }[];
}
declare namespace Mode {
    const Gaussians_1: number;
    export { Gaussians_1 as Gaussians };
    const Points_1: number;
    export { Points_1 as Points };
    const Nodes_1: number;
    export { Nodes_1 as Nodes };
}
