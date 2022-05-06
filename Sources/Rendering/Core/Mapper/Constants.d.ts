export declare enum ColorMode {
	DEFAULT = 0,
	MAP_SCALARS = 1,
	DIRECT_SCALARS = 2,
}

export declare enum ScalarMode {
	DEFAULT = 0,
	USE_POINT_DATA = 1,
	USE_CELL_DATA = 2,
	USE_POINT_FIELD_DATA = 3,
	USE_CELL_FIELD_DATA = 4,
	USE_FIELD_DATA = 5,
}

export declare enum GetArray {
	BY_ID = 0,
	BY_NAME = 1,
}

declare const _default: {
	ColorMode: typeof ColorMode;
	ScalarMode: typeof ScalarMode;
	GetArray: typeof GetArray;
};
export default _default;
