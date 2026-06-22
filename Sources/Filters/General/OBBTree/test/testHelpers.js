import { it, expect } from 'vitest';
import { CellType } from 'vtk.js/Sources/Common/DataModel/CellTypes/Constants';
import { getCellTriangles } from 'vtk.js/Sources/Filters/General/OBBTree/helper';

it('Test getCellTriangles', () => {
  function compareObjects(comparedObject, expectedObject) {
    expect(comparedObject.ptId0).toBe(expectedObject.ptId0);
    expect(comparedObject.ptId1).toBe(expectedObject.ptId1);
    expect(comparedObject.ptId2).toBe(expectedObject.ptId2);
  }

  const array = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  const objPyramid = getCellTriangles(array, CellType.VTK_PYRAMID, 2);
  compareObjects(objPyramid, { ptId0: -1, ptId1: -1, ptId2: -1 });

  const objTriangle = getCellTriangles(array, CellType.VTK_TRIANGLE, 20);
  compareObjects(objTriangle, { ptId0: -1, ptId1: -1, ptId2: -1 });

  const expected1 = { ptId0: 0, ptId1: 4, ptId2: 5 };
  const types = [
    CellType.VTK_TRIANGLE,
    CellType.VTK_POLYGON,
    CellType.VTK_QUAD,
  ];
  types.forEach((type) => {
    const obj = getCellTriangles(array, type, 3);
    compareObjects(obj, expected1);
  });

  const objTriangleStrip = getCellTriangles(
    array,
    CellType.VTK_TRIANGLE_STRIP,
    3
  );
  compareObjects(objTriangleStrip, { ptId0: 3, ptId1: 5, ptId2: 4 });
});
