export const HandleRepresentation = [0, 0, 0];

export const HandleRepresentationType = {
  // none is a sphere handle always invisible even on mouseover
  NONE: 'voidSphere',
  // 3D handles
  SPHERE: 'sphere',
  CUBE: 'cube',
  CONE: 'cone',
  // 2D handles
  ARROWHEAD3: 'triangle',
  ARROWHEAD4: '4pointsArrowHead',
  ARROWHEAD6: '6pointsArrowHead',
  STAR: 'star',
  CIRCLE: 'circle',
};

export default {
  HandleRepresentation,
  HandleRepresentationType,
};
