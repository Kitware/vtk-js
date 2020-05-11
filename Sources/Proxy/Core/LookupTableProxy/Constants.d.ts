declare namespace _default {
    export { Defaults };
    export { Mode };
}
export default _default;
declare namespace Defaults {
    export const Preset: string;
    export const RGBPoints: number[][];
    export const HSVPoints: number[][];
    export const Nodes: {
        x: number;
        r: number;
        g: number;
        b: number;
        midpoint: number;
        sharpness: number;
    }[];
}
declare namespace Mode {
    const Preset_1: number;
    export { Preset_1 as Preset };
    const RGBPoints_1: number;
    export { RGBPoints_1 as RGBPoints };
    const HSVPoints_1: number;
    export { HSVPoints_1 as HSVPoints };
    const Nodes_1: number;
    export { Nodes_1 as Nodes };
}
