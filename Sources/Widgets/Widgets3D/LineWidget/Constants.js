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
  NONE: 'sphere',
  // 2D handles
  ARROWHEAD3: 'triangle',
  ARROWHEAD4: '4pointsArrowHead',
  ARROWHEAD6: '6pointsArrowHead',
  STAR: 'star',
  CIRCLE: 'circle',
};

export default {
  HandleBehavior,
  Direction,
  HandleRepresentation,
  HandleRepresentationType,
};
