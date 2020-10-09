export const direction = [0, 0, 0];

export const handleRepresentation = [0, 0, 0];

export const handleBehavior = {
  HANDLE1_ALONE: 3,
  HANDLE2: 2,
  HANDLE1: 1,
};

export const handleRepresentationType = {
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
  handleBehavior,
  direction,
  handleRepresentation,
  handleRepresentationType,
};
