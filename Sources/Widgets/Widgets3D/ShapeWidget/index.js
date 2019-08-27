import {
  BehaviorCategory,
  ShapeBehavior,
} from 'vtk.js/Sources/Widgets/Widgets3D/ShapeWidget/Constants';

export const DEFAULT_VALUES = {
  manipulator: null,
  xAxis: [0, 0, 0],
  yAxis: [0, 0, 0],
  zAxis: [0, 0, 0],
  visibleOnFocus: true,
  modifierBehavior: {
    None: {
      [BehaviorCategory.PLACEMENT]:
        ShapeBehavior[BehaviorCategory.PLACEMENT].CLICK_AND_DRAG,
      [BehaviorCategory.POINTS]:
        ShapeBehavior[BehaviorCategory.POINTS].CORNER_TO_CORNER,
      [BehaviorCategory.RATIO]: ShapeBehavior[BehaviorCategory.RATIO].FREE,
    },
  },
  keysDown: {},
  resetAfterPointPlacement: true,
  useHandles: false,
  pixelScale: 10,
};

export default { DEFAULT_VALUES };
