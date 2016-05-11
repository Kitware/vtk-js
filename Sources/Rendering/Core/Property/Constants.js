export const SHADING_MODEL = [
  'VTK_FLAT',    // 0
  'VTK_GOURAUD', // 1
  'VTK_PHONG',   // 2
];

export const SHADINGS = {
  VTK_FLAT: 0,
  VTK_GOURAUD: 1,
  VTK_PHONG: 2,
};

export const REPRESENTATION_MODEL = [
  'VTK_POINTS',    // 0
  'VTK_WIREFRAME', // 1
  'VTK_SURFACE',   // 2
];

export const REPRESENTATIONS = {
  VTK_POINTS: 0,
  VTK_WIREFRAME: 1,
  VTK_SURFACE: 2,
};

export default { SHADINGS, SHADING_MODEL, REPRESENTATIONS, REPRESENTATION_MODEL };
