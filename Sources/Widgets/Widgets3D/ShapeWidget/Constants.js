export const BehaviorCategory = {
  POINTS: 'POINTS',
  PLACEMENT: 'PLACEMENT',
  RATIO: 'RATIO',
};

export const ShapeBehavior = {
  [BehaviorCategory.POINTS]: {
    CORNER_TO_CORNER: 0,
    CENTER_TO_CORNER: 1,
    RADIUS: 2,
    DIAMETER: 3,
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

export const HorizontalTextPosition = {
  OUTSIDE_LEFT: 'OUSIDE_LEFT',
  INSIDE_LEFT: 'INSIDE_LEFT',
  OUTSIDE_RIGHT: 'OUSIDE_RIGHT',
  INSIDE_RIGHT: 'INSIDE_RIGHT',
  MIDDLE: 'MIDDLE',
};

export const VerticalTextPosition = {
  OUTSIDE_TOP: 'OUSIDE_TOP',
  INSIDE_TOP: 'INSIDE_TOP',
  OUTSIDE_BOTTOM: 'OUSIDE_BOTTOM',
  INSIDE_BOTTOM: 'INSIDE_BOTTOM',
  MIDDLE: 'MIDDLE',
};

export function computeTextPosition(
  bounds,
  horizontalPosition,
  verticalPosition,
  textWidth,
  textHeight
) {
  let x = 0;
  switch (horizontalPosition) {
    case HorizontalTextPosition.OUTSIDE_LEFT:
      x = bounds[0] - textWidth;
      break;
    case HorizontalTextPosition.INSIDE_LEFT:
      x = bounds[0];
      break;
    case HorizontalTextPosition.MIDDLE:
      x = 0.5 * (bounds[0] + bounds[1] - textWidth);
      break;
    case HorizontalTextPosition.INSIDE_RIGHT:
      x = bounds[1] - textWidth;
      break;
    case HorizontalTextPosition.OUTSIDE_RIGHT:
      x = bounds[1];
      break;
    default:
      break;
  }

  let y = 0;
  switch (verticalPosition) {
    case VerticalTextPosition.OUTSIDE_TOP:
      y = bounds[3] + textHeight;
      break;
    case VerticalTextPosition.INSIDE_TOP:
      y = bounds[3];
      break;
    case VerticalTextPosition.MIDDLE:
      y = 0.5 * (bounds[2] + bounds[3] + textWidth);
      break;
    case VerticalTextPosition.INSIDE_BOTTOM:
      y = bounds[2] + textHeight;
      break;
    case VerticalTextPosition.OUTSIDE_BOTTOM:
      y = bounds[2];
      break;
    default:
      break;
  }

  return [x, y, 0];
}

export default ShapeBehavior;
