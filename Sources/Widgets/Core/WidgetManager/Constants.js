export const ViewTypes = {
  DEFAULT: 0,
  GEOMETRY: 1,
  SLICE: 2,
  VOLUME: 3,
  YZ_PLANE: 4, // Sagittal
  XZ_PLANE: 5, // Coronal
  XY_PLANE: 6, // Axial
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
