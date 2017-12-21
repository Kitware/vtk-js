const WidgetState = {
  IDLE: 0,
  MOVE_XLOWER: -1,
  MOVE_XUPPER: -2,
  MOVE_YLOWER: -3,
  MOVE_YUPPER: -4,
  MOVE_XLOWER_YLOWER: -5,
  MOVE_XLOWER_YUPPER: -6,
  MOVE_XUPPER_YLOWER: -7,
  MOVE_XUPPER_YUPPER: -8,

  MOVE_LEFT: 1,
  MOVE_RIGHT: 2,
  MOVE_BOTTOM: 3,
  MOVE_TOP: 4,
  MOVE_LEFT_BOTTOM: 5,
  MOVE_LEFT_TOP: 6,
  MOVE_RIGHT_BOTTOM: 7,
  MOVE_RIGHT_TOP: 8,
};

const SliceNormals = ['X', 'Y', 'Z'];

export default { WidgetState, SliceNormals };
