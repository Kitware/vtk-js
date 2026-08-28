export declare const ColorMode: {
  readonly DEFAULT: 0;
  readonly MAP_SCALARS: 1;
  readonly DIRECT_SCALARS: 2;
};

export type ColorMode = (typeof ColorMode)[keyof typeof ColorMode];

export declare const ScalarMode: {
  readonly DEFAULT: 0;
  readonly USE_POINT_DATA: 1;
  readonly USE_CELL_DATA: 2;
  readonly USE_POINT_FIELD_DATA: 3;
  readonly USE_CELL_FIELD_DATA: 4;
  readonly USE_FIELD_DATA: 5;
};

export type ScalarMode = (typeof ScalarMode)[keyof typeof ScalarMode];

export declare const GetArray: {
  readonly BY_ID: 0;
  readonly BY_NAME: 1;
};

export type GetArray = (typeof GetArray)[keyof typeof GetArray];

declare const _default: {
  ColorMode: typeof ColorMode;
  ScalarMode: typeof ScalarMode;
  GetArray: typeof GetArray;
};
export default _default;
