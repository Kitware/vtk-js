export const Device = {
  Unknown: 0,
  LeftController: 1,
  RightController: 2,
};

export const Input = {
  Unknown: 0,
  Trigger: 1,
  TrackPad: 2,
  Grip: 3,
  Thumbstick: 4,
  A: 5,
  B: 6,
  ApplicationMenu: 7, // Not exposed in WebXR API
};

export const Axis = {
  Unknown: 0,
  TouchpadX: 1,
  TouchpadY: 2,
  ThumbstickX: 3,
  ThumbstickY: 4,
};

export default {
  Device,
  Input,
  Axis,
};
