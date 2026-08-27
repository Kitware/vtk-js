export declare const BehaviorCategory: {
  readonly POINTS: 'POINTS';
  readonly PLACEMENT: 'PLACEMENT';
  readonly RATIO: 'RATIO';
};

export type BehaviorCategory =
  (typeof BehaviorCategory)[keyof typeof BehaviorCategory];

export declare const ShapeBehavior: {
  readonly POINTS: {
    readonly CORNER_TO_CORNER: 0;
    readonly CENTER_TO_CORNER: 1;
    readonly RADIUS: 2;
    readonly DIAMETER: 3;
  };
  readonly PLACEMENT: {
    readonly CLICK: 0;
    readonly DRAG: 1;
    readonly CLICK_AND_DRAG: 2;
  };
  readonly RATIO: {
    readonly FIXED: 0;
    readonly FREE: 1;
  };
};

export type ShapeBehavior = (typeof ShapeBehavior)[keyof typeof ShapeBehavior];

export declare const TextPosition: {
  readonly MIN: 'MIN';
  readonly CENTER: 'CENTER';
  readonly MAX: 'MAX';
};

export type TextPosition = (typeof TextPosition)[keyof typeof TextPosition];

declare const _default: typeof ShapeBehavior;

export default _default;
