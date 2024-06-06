import { Vector3 } from '../../../types';
import { ViewTypes } from '../../Core/WidgetManager/Constants';

// Different types of plane from ViewTypes:
export type PlaneViewType =
  | ViewTypes.YZ_PLANE
  | ViewTypes.XZ_PLANE
  | ViewTypes.XY_PLANE;

// 0, 1, 2 for X, Y, Z
export type AxisIndex = 0 | 1 | 2;

// Should be X, Y, Z
export type PlaneName = typeof planeNames extends (infer U)[] ? U : never;

export declare enum ScrollingMethods {
  MIDDLE_MOUSE_BUTTON = 0,
  LEFT_MOUSE_BUTTON = 1,
  RIGHT_MOUSE_BUTTON = 2,
}

// Note: These strings are used in ResliceCursorWidget/behavior.js
// as method's names
export declare enum InteractionMethodsName {
  TranslateAxis = 'translateAxis',
  RotateLine = 'rotateLine',
  TranslateCenter = 'translateCenter',
  TranslateCenterAndUpdatePlanes = 'translateCenterAndUpdatePlanes',
}

export declare const defaultViewUpFromViewType: {
  [plane in PlaneViewType]: Vector3;
};

export declare const xyzToViewType: [
  PlaneViewType,
  PlaneViewType,
  PlaneViewType
];

export declare const viewTypeToXYZ: { [plane in PlaneViewType]: AxisIndex };

export declare const planeNames: ['X', 'Y', 'Z'];

export declare const viewTypeToPlaneName: {
  [plane in PlaneViewType]: PlaneName;
};

export declare const planeNameToViewType: {
  [planeName in PlaneName]: PlaneViewType;
};

export declare const lineNames: [
  'YinX',
  'ZinX',
  'XinY',
  'ZinY',
  'XinZ',
  'YinZ'
];

declare const _default: {
  ScrollingMethods: typeof ScrollingMethods;
  InteractionMethodsName: typeof InteractionMethodsName;
  xyzToViewType: typeof xyzToViewType;
  viewTypeToXYZ: typeof viewTypeToXYZ;
  planeNames: typeof planeNames;
  viewTypeToPlaneName: typeof viewTypeToPlaneName;
  planeNameToViewType: typeof planeNameToViewType;
  lineNames: typeof lineNames;
};

export default _default;
