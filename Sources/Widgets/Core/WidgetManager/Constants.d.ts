export declare enum ViewTypes {
  DEFAULT = 0,
  GEOMETRY = 1,
  SLICE = 2,
  VOLUME = 3,
  YZ_PLANE = 4,
  XZ_PLANE = 5,
  XY_PLANE = 6
}

export declare enum RenderingTypes {
  PICKING_BUFFER = 0,
  FRONT_BUFFER = 1
}

export declare enum CaptureOn {
  MOUSE_MOVE = 0,
  MOUSE_RELEASE = 1
}

declare const _default: {
  ViewTypes: typeof ViewTypes;
  RenderingTypes: typeof RenderingTypes;
  CaptureOn: typeof CaptureOn;
}

export default _default;
