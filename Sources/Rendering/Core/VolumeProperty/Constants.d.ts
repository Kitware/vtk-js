export declare enum InterpolationType {
	NEAREST = 0,
	LINEAR = 1,
	FAST_LINEAR = 2
}

export declare enum OpacityMode {
	FRACTIONAL = 0,
	PROPORTIONAL = 1,
}

export declare enum ColorMixPreset {
	// Add a `//VTK::CustomColorMix` tag to the Fragment shader
	// See usage in file `testColorMix` and in function `setColorMixPreset`
	CUSTOM = 0,
	// Adds the opacities and the colors weighted by opacity
	ADDITIVE = 1,
}

declare const _default: {
	InterpolationType: typeof InterpolationType;
	OpacityMode: typeof OpacityMode;
	ColorMixPreset: typeof ColorMixPreset;
};
export default _default;
