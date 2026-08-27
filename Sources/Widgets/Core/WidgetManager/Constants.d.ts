export declare const ViewTypes: {
  readonly DEFAULT: 0;
  readonly GEOMETRY: 1;
  readonly SLICE: 2;
  readonly VOLUME: 3;
  readonly YZ_PLANE: 4;
  readonly XZ_PLANE: 5;
  readonly XY_PLANE: 6;
};

export type ViewTypes = (typeof ViewTypes)[keyof typeof ViewTypes];

export declare const RenderingTypes: {
  readonly PICKING_BUFFER: 0;
  readonly FRONT_BUFFER: 1;
};

export type RenderingTypes =
  (typeof RenderingTypes)[keyof typeof RenderingTypes];

export declare const CaptureOn: {
  readonly MOUSE_MOVE: 0;
  readonly MOUSE_RELEASE: 1;
};

export type CaptureOn = (typeof CaptureOn)[keyof typeof CaptureOn];

declare const _default: {
  ViewTypes: typeof ViewTypes;
  RenderingTypes: typeof RenderingTypes;
  CaptureOn: typeof CaptureOn;
};

export default _default;
