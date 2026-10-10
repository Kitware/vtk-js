export declare const ExtractionMode: {
  readonly ExtractionMode_ALL: 0;
  readonly ExtractionMode_LARGEST: 1;
  readonly ExtractionMode_SMALLEST: 2;
  readonly ExtractionMode_CUSTOM: 3;
};

export type ExtractionMode =
  (typeof ExtractionMode)[keyof typeof ExtractionMode];

declare const _default: {
  ExtractionMode: typeof ExtractionMode;
};
export default _default;
