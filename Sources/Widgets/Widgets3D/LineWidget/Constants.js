export const Direction = [0, 0, 0];

export const HandleRepresentation = [0, 0, 0];

export const HandleBehavior = {
  HANDLE1_ALONE: 3,
  HANDLE2: 2,
  HANDLE1: 1,
};

export const HandleRepresentationType = {
  // 3D handles
  SPHERE: 'sphere',
  CUBE: 'cube',
  CONE: 'cone',
  // none is a sphere handle always invisible even on mouseover
  NONE: 'voidSphere',
  // 2D handles
  ARROWHEAD3: 'triangle',
  ARROWHEAD4: '4pointsArrowHead',
  ARROWHEAD6: '6pointsArrowHead',
  STAR: 'star',
  CIRCLE: 'circle',
};

export const HandleVisibilityBehavior = {
  TOGGLE_ON: 1,
  TOGGLE_OFF: 2,
};

export default {
  HandleBehavior,
  Direction,
  HandleRepresentation,
  HandleRepresentationType,
  HandleVisibilityBehavior,
};
