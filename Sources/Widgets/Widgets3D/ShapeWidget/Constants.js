export const BehaviorCategory = {
  POINTS: 'POINTS',
  PLACEMENT: 'PLACEMENT',
  RATIO: 'RATIO',
};

export const ShapeBehavior = {
  [BehaviorCategory.POINTS]: {
    CORNER_TO_CORNER: 0,
    CENTER_TO_CORNER: 1,
  },
  [BehaviorCategory.PLACEMENT]: {
    CLICK: 0,
    DRAG: 1,
    CLICK_AND_DRAG: 2,
  },
  [BehaviorCategory.RATIO]: {
    FIXED: 0,
    FREE: 1,
  },
};

export default ShapeBehavior;
