export declare const ROTATE_HANDLE_PIXEL_SCALE: number;
export declare const TRANSLATE_HANDLE_RADIUS: number;
export declare const SCALE_HANDLE_RADIUS: number;
export declare const SCALE_HANDLE_CUBE_SIDE_LENGTH: number;
export declare const SCALE_HANDLE_PIXEL_SCALE: number;

export declare const TransformMode: {
  readonly TRANSLATE: 'translate';
  readonly SCALE: 'scale';
  readonly ROTATE: 'rotate';
};

export type TransformMode = (typeof TransformMode)[keyof typeof TransformMode];

declare const _default: {
  TransformMode: typeof TransformMode;
};

export default _default;
