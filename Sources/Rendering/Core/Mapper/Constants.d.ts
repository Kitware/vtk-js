export namespace ColorMode {
    export const DEFAULT: number;
    export const MAP_SCALARS: number;
    export const DIRECT_SCALARS: number;
}
export namespace ScalarMode {
    const DEFAULT_1: number;
    export { DEFAULT_1 as DEFAULT };
    export const USE_POINT_DATA: number;
    export const USE_CELL_DATA: number;
    export const USE_POINT_FIELD_DATA: number;
    export const USE_CELL_FIELD_DATA: number;
    export const USE_FIELD_DATA: number;
}
export namespace GetArray {
    export const BY_ID: number;
    export const BY_NAME: number;
}
declare namespace _default {
    export { ColorMode };
    export { GetArray };
    export { ScalarMode };
}
export default _default;
