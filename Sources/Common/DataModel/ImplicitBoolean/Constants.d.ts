export declare const Operation: {
  readonly UNION: 0;
  readonly INTERSECTION: 1;
  readonly DIFFERENCE: 2;
};

export type Operation = (typeof Operation)[keyof typeof Operation];

declare const _default: {
  Operation: typeof Operation;
};
export default _default;
