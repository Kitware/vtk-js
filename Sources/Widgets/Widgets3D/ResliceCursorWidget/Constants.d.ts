import { Vector3 } from '../../../types';
import { ViewTypes } from '../../Core/WidgetManager/Constants';

// Different types of plane from ViewTypes:
export type PlaneViewType = (typeof ViewTypes)[
  | 'YZ_PLANE'
  | 'XZ_PLANE'
  | 'XY_PLANE'];

// 0, 1, 2 for X, Y, Z
export type AxisIndex = 0 | 1 | 2;

// Should be X, Y, Z
export type PlaneName = typeof planeNames extends (infer U)[] ? U : never;

export declare const ScrollingMethods: {
  readonly MIDDLE_MOUSE_BUTTON: 0;
  readonly LEFT_MOUSE_BUTTON: 1;
  readonly RIGHT_MOUSE_BUTTON: 2;
};

export type ScrollingMethods =
  (typeof ScrollingMethods)[keyof typeof ScrollingMethods];

// Note: These strings are used in ResliceCursorWidget/behavior.js
// as method's names
export declare const InteractionMethodsName: {
  readonly TranslateAxis: 'translateAxis';
  readonly RotateLine: 'rotateLine';
  readonly TranslateCenter: 'translateCenter';
  readonly TranslateCenterAndUpdatePlanes: 'translateCenterAndUpdatePlanes';
};

export type InteractionMethodsName =
  (typeof InteractionMethodsName)[keyof typeof InteractionMethodsName];

export declare const defaultViewUpFromViewType: {
  [plane in PlaneViewType]: Vector3;
};

export declare const xyzToViewType: [
  PlaneViewType,
  PlaneViewType,
  PlaneViewType,
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
  'YinZ',
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
