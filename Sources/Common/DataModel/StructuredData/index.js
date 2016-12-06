import { VTK_STRUCTURED_TYPE } from './Constants';

export function setExtent(minI, maxI, minJ, maxJ, minK, maxK, model) {
  let dataDescription = VTK_STRUCTURED_TYPE.VTK_EMPTY;
  const inExt = [minI, maxI, minJ, maxJ, minK, maxK];
  const ext = [].concat(model.extent);

  if (inExt[0] === ext[0] && inExt[1] === ext[1] &&
      inExt[2] === ext[2] && inExt[3] === ext[3] &&
      inExt[4] === ext[4] && inExt[5] === ext[5]) {
    return VTK_STRUCTURED_TYPE.VTK_UNCHANGED;
  }

  let dataDim = 0;
  for (let i = 0; i < 3; ++i) {
    ext[(i * 2) + 0] = inExt[(i * 2) + 0];
    ext[(i * 2) + 1] = inExt[(i * 2) + 1];
    if (inExt[i * 2] < inExt[(i * 2) + 1]) {
      dataDim++;
    }
  }

  if (inExt[0] > inExt[1] || inExt[2] > inExt[3] || inExt[4] > inExt[5]) {
    return VTK_STRUCTURED_TYPE.VTK_EMPTY;
  }

  if (dataDim === 3) {
    dataDescription = VTK_STRUCTURED_TYPE.VTK_XYZ_GRID;
  } else if (dataDim === 2) {
    if (inExt[0] === inExt[1]) {
      dataDescription = VTK_STRUCTURED_TYPE.VTK_YZ_PLANE;
    } else if (inExt[2] === inExt[3]) {
      dataDescription = VTK_STRUCTURED_TYPE.VTK_XZ_PLANE;
    } else {
      dataDescription = VTK_STRUCTURED_TYPE.VTK_XY_PLANE;
    }
  } else if (dataDim === 1) {
    if (inExt[0] < inExt[1]) {
      dataDescription = VTK_STRUCTURED_TYPE.VTK_X_LINE;
    } else if (inExt[2] < inExt[3]) {
      dataDescription = VTK_STRUCTURED_TYPE.VTK_Y_LINE;
    } else {
      dataDescription = VTK_STRUCTURED_TYPE.VTK_Z_LINE;
    }
  } else {
    dataDescription = VTK_STRUCTURED_TYPE.VTK_SINGLE_POINT;
  }

  return dataDescription;
}

export default {
  setExtent,
};
