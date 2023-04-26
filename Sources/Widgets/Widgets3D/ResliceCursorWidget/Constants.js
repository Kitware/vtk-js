import { ViewTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';

export const ScrollingMethods = {
  MIDDLE_MOUSE_BUTTON: 0,
  LEFT_MOUSE_BUTTON: 1,
  RIGHT_MOUSE_BUTTON: 2,
};

// Note: These strings are used in ResliceCursorWidget/behavior.js
// as method's names
export const InteractionMethodsName = {
  TranslateAxis: 'translateAxis',
  RotateLine: 'rotateLine',
  TranslateCenter: 'translateCenter',
  TranslateCenterAndUpdatePlanes: 'translateCenterAndUpdatePlanes',
};

export const defaultViewUpFromViewType = {
  [ViewTypes.YZ_PLANE]: [0, 0, 1], // Sagittal
  [ViewTypes.XZ_PLANE]: [0, 0, 1], // Coronal
  [ViewTypes.XY_PLANE]: [0, -1, 0], // Axial
};

export const xyzToViewType = [
  ViewTypes.YZ_PLANE,
  ViewTypes.XZ_PLANE,
  ViewTypes.XY_PLANE,
];

export const viewTypeToXYZ = {
  [ViewTypes.YZ_PLANE]: 0,
  [ViewTypes.XZ_PLANE]: 1,
  [ViewTypes.XY_PLANE]: 2,
};

export const planeNames = ['X', 'Y', 'Z'];

export const viewTypeToPlaneName = {
  [ViewTypes.YZ_PLANE]: 'X',
  [ViewTypes.XZ_PLANE]: 'Y',
  [ViewTypes.XY_PLANE]: 'Z',
};

export const planeNameToViewType = {
  X: ViewTypes.YZ_PLANE,
  Y: ViewTypes.XZ_PLANE,
  Z: ViewTypes.XY_PLANE,
};
export const lineNames = ['YinX', 'ZinX', 'XinY', 'ZinY', 'XinZ', 'YinZ'];

export default {
  ScrollingMethods,
  InteractionMethodsName,
  xyzToViewType,
  viewTypeToXYZ,
  planeNames,
  viewTypeToPlaneName,
  planeNameToViewType,
  lineNames,
};
