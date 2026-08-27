export declare const ImageBorderMode: {
  readonly CLAMP: 0;
  readonly REPEAT: 1;
  readonly MIRROR: 2;
};

export type ImageBorderMode =
  (typeof ImageBorderMode)[keyof typeof ImageBorderMode];

export declare const InterpolationMode: {
  readonly NEAREST: 0;
  readonly LINEAR: 1;
  readonly CUBIC: 2;
};

export type InterpolationMode =
  (typeof InterpolationMode)[keyof typeof InterpolationMode];

declare const _default: {
  ImageBorderMode: typeof ImageBorderMode;
  InterpolationMode: typeof InterpolationMode;
};

export default _default;
