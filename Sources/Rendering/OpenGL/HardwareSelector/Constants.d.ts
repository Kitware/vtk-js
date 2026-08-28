export declare const PassTypes: {
  readonly MIN_KNOWN_PASS: 0;
  readonly ACTOR_PASS: 0;
  readonly COMPOSITE_INDEX_PASS: 1;
  readonly ID_LOW24: 2;
  readonly ID_HIGH24: 3;
  readonly MAX_KNOWN_PASS: 3;
};

export type PassTypes = (typeof PassTypes)[keyof typeof PassTypes];

declare const _default: {
  PassTypes: typeof PassTypes;
};
export default _default;
