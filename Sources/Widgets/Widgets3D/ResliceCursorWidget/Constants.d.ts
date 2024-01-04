import { ViewTypes } from '../../Core/WidgetManager/Constants';

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

export declare type defaultViewUpFromViewType = {
  [ViewTypes.YZ_PLANE]: [0, 0, 1], // Sagittal
  [ViewTypes.XZ_PLANE]: [0, 0, 1], // Coronal
  [ViewTypes.XY_PLANE]: [0, -1, 0], // Axial
}

export declare type xyzToViewType = [
  ViewTypes.YZ_PLANE,
  ViewTypes.XZ_PLANE,
  ViewTypes.XY_PLANE,
];

export declare type viewTypeToXYZ = {
  [ViewTypes.YZ_PLANE]: 0,
  [ViewTypes.XZ_PLANE]: 1,
  [ViewTypes.XY_PLANE]: 2,
}

export declare type planeNames = ['X', 'Y', 'Z'];

export declare type viewTypeToPlaneName = {
  [ViewTypes.YZ_PLANE]: 'X',
  [ViewTypes.XZ_PLANE]: 'Y',
  [ViewTypes.XY_PLANE]: 'Z',
}

export declare type planeNameToViewType = {
  X: ViewTypes.YZ_PLANE,
  Y: ViewTypes.XZ_PLANE,
  Z: ViewTypes.XY_PLANE,
}
export declare type lineNames = ['YinX', 'ZinX', 'XinY', 'ZinY', 'XinZ', 'YinZ'];

declare const _default: {
  ScrollingMethods: typeof ScrollingMethods;
  InteractionMethodsName: typeof InteractionMethodsName;
  xyzToViewType: xyzToViewType;
  viewTypeToXYZ: viewTypeToXYZ;
  planeNames: planeNames;
  viewTypeToPlaneName: viewTypeToPlaneName;
  planeNameToViewType: planeNameToViewType;
  lineNames: lineNames;
}

export default _default;
