import { VTK_STRUCTURED_TYPE } from './Constants';

export function getDataDescriptionFromExtent(inExt) {
  let dataDim = 0;
  for (let i = 0; i < 3; ++i) {
    if (inExt[i * 2] < inExt[(i * 2) + 1]) {
      dataDim++;
    }
  }

  if (inExt[0] > inExt[1] || inExt[2] > inExt[3] || inExt[4] > inExt[5]) {
    return VTK_STRUCTURED_TYPE.VTK_EMPTY;
  }

  if (dataDim === 3) {
    return VTK_STRUCTURED_TYPE.VTK_XYZ_GRID;
  } else if (dataDim === 2) {
    if (inExt[0] === inExt[1]) {
      return VTK_STRUCTURED_TYPE.VTK_YZ_PLANE;
    } else if (inExt[2] === inExt[3]) {
      return VTK_STRUCTURED_TYPE.VTK_XZ_PLANE;
    }
    return VTK_STRUCTURED_TYPE.VTK_XY_PLANE;
  } else if (dataDim === 1) {
    if (inExt[0] < inExt[1]) {
      return VTK_STRUCTURED_TYPE.VTK_X_LINE;
    } else if (inExt[2] < inExt[3]) {
      return VTK_STRUCTURED_TYPE.VTK_Y_LINE;
    }
    return VTK_STRUCTURED_TYPE.VTK_Z_LINE;
  }

  return VTK_STRUCTURED_TYPE.VTK_SINGLE_POINT;
}

export default {
  getDataDescriptionFromExtent,
};
