import { CellType } from 'vtk.js/Sources/Common/DataModel/CellTypes/Constants';
import vtkOBJReader from 'vtk.js/Sources/IO/Misc/OBJReader';

/**
 * Get the correct point ID from a cell id
 * @param {Array} cellPtsIds
 * @param {CellType} type
 * @param {Number} idx
 * @returns {Object} Contains three point's id of cells as 'ptId0', 'ptId1', 'ptId2'
 */
export function getCellTriangles(cellPtsIds, type, idx) {
  let ptId0 = -1;
  let ptId1 = -1;
  let ptId2 = -1;

  const cellListLength = cellPtsIds.length;

  switch (type) {
    case CellType.VTK_TRIANGLE:
    case CellType.VTK_POLYGON:
    case CellType.VTK_QUAD: {
      if (idx > cellListLength) break;
      ptId0 = cellPtsIds[0];
      ptId1 = cellPtsIds[idx + 1];
      ptId2 = cellPtsIds[idx + 2];
      break;
    }
    case CellType.VTK_TRIANGLE_STRIP: {
      // eslint-disable-next-line no-bitwise
      const idx1 = idx + 1 + (idx & 1);
      // eslint-disable-next-line no-bitwise
      const idx2 = idx + 2 - (idx & 1);

      if (idx1 > cellListLength || idx2 > cellListLength) break;

      ptId0 = cellPtsIds[idx];
      ptId1 = cellPtsIds[idx1];
      ptId2 = cellPtsIds[idx2];
      break;
    }
    default:
      ptId0 = -1;
      ptId1 = -1;
      ptId2 = -1;
      break;
  }

  return { ptId0, ptId1, ptId2 };
}

/**
 * Concatenate second typed array to the first typed array.
 * @param {TypedArray} first
 * @param {TypedArray} second Must be of the same type as first
 * @return {TypedArray}
 */
export function pushArray(first, second) {
  const firstLength = first.length;
  const result = new first.constructor(firstLength + second.length);

  result.set(first);
  result.set(second, firstLength);

  return result;
}

/**
 * Load an obj with point's colors
 *
 * @param {string} url path to the OBJ file
 * @return Promise
 * ---> success : Return vtkPolyData
 * ---> failed : Error message
 */
export function loadOBJ(url) {
  return new Promise((resolve, reject) => {
    const reader = vtkOBJReader.newInstance();
    reader.setUrl(url).then(
      () => {
        const data = reader.getOutputData();
        resolve(data);
      },
      () => {
        // eslint-disable-next-line prefer-promise-reject-errors
        reject('Error when loading ', url);
      }
    );
  });
}
