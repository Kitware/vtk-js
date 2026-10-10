export declare const Orientation: {
  readonly HORIZONTAL: 'horizontal';
  readonly VERTICAL: 'vertical';
  readonly AUTO: 'auto';
};

export type Orientation = (typeof Orientation)[keyof typeof Orientation];

declare const _default: {
  Orientation: typeof Orientation;
};
export default _default;
