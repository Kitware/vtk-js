export declare const ShapeType: {
  readonly TRIANGLE: 'triangle';
  readonly STAR: 'star';
  readonly ARROW_4: 'arrow4points';
  readonly ARROW_6: 'arrow6points';
};

export type ShapeType = (typeof ShapeType)[keyof typeof ShapeType];

declare const _default: {
  ShapeType: typeof ShapeType;
};
export default _default;
