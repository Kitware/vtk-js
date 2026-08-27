export declare const ObjectType: {
  readonly ARRAY_BUFFER: 0;
  readonly ELEMENT_ARRAY_BUFFER: 1;
  readonly TEXTURE_BUFFER: 2;
};

export type ObjectType = (typeof ObjectType)[keyof typeof ObjectType];

declare const _default: {
  ObjectType: typeof ObjectType;
};

export default _default;
