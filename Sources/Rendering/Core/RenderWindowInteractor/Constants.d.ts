export declare const Device: {
  readonly Unknown: 0;
  readonly LeftController: 1;
  readonly RightController: 2;
};

export type Device = (typeof Device)[keyof typeof Device];

export declare const Input: {
  readonly Unknown: 0;
  readonly Trigger: 1;
  readonly TrackPad: 2;
  readonly Grip: 3;
  readonly Thumbstick: 4;
  readonly A: 5;
  readonly B: 6;
  readonly ApplicationMenu: 7; // Not exposed in WebXR API
};

export type Input = (typeof Input)[keyof typeof Input];

export declare const Axis: {
  readonly Unknown: 0;
  readonly TouchpadX: 1;
  readonly TouchpadY: 2;
  readonly ThumbstickX: 3;
  readonly ThumbstickY: 4;
};

export type Axis = (typeof Axis)[keyof typeof Axis];

export declare const MouseButton: {
  readonly LeftButton: 1;
  readonly MiddleButton: 2;
  readonly RightButton: 3;
};

export type MouseButton = (typeof MouseButton)[keyof typeof MouseButton];

declare const _default: {
  Device: typeof Device;
  Input: typeof Input;
  Axis: typeof Axis;
  MouseButton: typeof MouseButton;
};
export default _default;
