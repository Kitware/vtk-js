export const HandleRepresentation = [0, 0, 0];

export const HandleRepresentationType = {
  // NONE is a sphere handle always invisible even on mouseover, which
  // prevents user from moving handle once it is placed
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
  DISK: 'disk',
  CIRCLE: 'circle',
  VIEWFINDER: 'viewFinder',
};

export default {
  HandleRepresentation,
  HandleRepresentationType,
};
