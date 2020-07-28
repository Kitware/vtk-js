export const ViewTypes = {
  DEFAULT: 0,
  GEOMETRY: 1,
  SLICE: 2,
  VOLUME: 3,
  AXIAL: 4,
  CORONAL: 5,
  SAGITTAL: 6,
};

export const RenderingTypes = {
  PICKING_BUFFER: 0,
  FRONT_BUFFER: 1,
};

export const CaptureOn = {
  MOUSE_MOVE: 0,
  MOUSE_RELEASE: 1,
};

export default {
  ViewTypes,
  RenderingTypes,
  CaptureOn,
};
