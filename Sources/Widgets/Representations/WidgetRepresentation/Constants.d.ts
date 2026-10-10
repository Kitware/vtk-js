export declare const Behavior: {
  readonly HANDLE: 0;
  readonly CONTEXT: 1;
};

export type Behavior = (typeof Behavior)[keyof typeof Behavior];

declare const _default: {
  Behavior: typeof Behavior;
};

export default _default;
