export function computeTextPosition(bounds: any, horizontalPosition: any, verticalPosition: any, textWidth: any, textHeight: any): number[];
export namespace BehaviorCategory {
    export const POINTS: string;
    export const PLACEMENT: string;
    export const RATIO: string;
}
export const ShapeBehavior: {
    [x: string]: {
        CORNER_TO_CORNER: number;
        CENTER_TO_CORNER: number;
        RADIUS: number;
        DIAMETER: number;
        CLICK?: undefined;
        DRAG?: undefined;
        CLICK_AND_DRAG?: undefined;
        FIXED?: undefined;
        FREE?: undefined;
    } | {
        CLICK: number;
        DRAG: number;
        CLICK_AND_DRAG: number;
        CORNER_TO_CORNER?: undefined;
        CENTER_TO_CORNER?: undefined;
        RADIUS?: undefined;
        DIAMETER?: undefined;
        FIXED?: undefined;
        FREE?: undefined;
    } | {
        FIXED: number;
        FREE: number;
        CORNER_TO_CORNER?: undefined;
        CENTER_TO_CORNER?: undefined;
        RADIUS?: undefined;
        DIAMETER?: undefined;
        CLICK?: undefined;
        DRAG?: undefined;
        CLICK_AND_DRAG?: undefined;
    };
};
export namespace HorizontalTextPosition {
    export const OUTSIDE_LEFT: string;
    export const INSIDE_LEFT: string;
    export const OUTSIDE_RIGHT: string;
    export const INSIDE_RIGHT: string;
    export const MIDDLE: string;
}
export namespace VerticalTextPosition {
    export const OUTSIDE_TOP: string;
    export const INSIDE_TOP: string;
    export const OUTSIDE_BOTTOM: string;
    export const INSIDE_BOTTOM: string;
    const MIDDLE_1: string;
    export { MIDDLE_1 as MIDDLE };
}
export default ShapeBehavior;
