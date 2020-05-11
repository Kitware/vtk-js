declare var _default: ({
    label: string;
    id?: undefined;
    fov?: undefined;
    interLensDistance?: undefined;
    baselineLensDistance?: undefined;
    screenLensDistance?: undefined;
    distortionCoefficients?: undefined;
    inverseCoefficients?: undefined;
} | {
    id: string;
    label: string;
    fov: number;
    interLensDistance: number;
    baselineLensDistance: number;
    screenLensDistance: number;
    distortionCoefficients: number[];
    inverseCoefficients: number[];
})[];
export default _default;
