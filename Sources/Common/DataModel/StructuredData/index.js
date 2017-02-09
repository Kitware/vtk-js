import { StructuredType } from 'vtk.js/Sources/Common/DataModel/StructuredData/Constants';

export function getDataDescriptionFromExtent(inExt) {
  let dataDim = 0;
  for (let i = 0; i < 3; ++i) {
    if (inExt[i * 2] < inExt[(i * 2) + 1]) {
      dataDim++;
    }
  }

  if (inExt[0] > inExt[1] || inExt[2] > inExt[3] || inExt[4] > inExt[5]) {
    return StructuredType.EMPTY;
  }

  if (dataDim === 3) {
    return StructuredType.XYZ_GRID;
  } else if (dataDim === 2) {
    if (inExt[0] === inExt[1]) {
      return StructuredType.YZ_PLANE;
    } else if (inExt[2] === inExt[3]) {
      return StructuredType.XZ_PLANE;
    }
    return StructuredType.XY_PLANE;
  } else if (dataDim === 1) {
    if (inExt[0] < inExt[1]) {
      return StructuredType.X_LINE;
    } else if (inExt[2] < inExt[3]) {
      return StructuredType.Y_LINE;
    }
    return StructuredType.Z_LINE;
  }

  return StructuredType.SINGLE_POINT;
}

export default {
  getDataDescriptionFromExtent,
};
