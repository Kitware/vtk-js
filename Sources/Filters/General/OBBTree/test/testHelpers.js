import test from 'tape-catch';

import { CellType } from 'vtk.js/Sources/Common/DataModel/CellTypes/Constants';
import { getCellTriangles } from 'vtk.js/Sources/Filters/General/OBBTree/helper';

test('Test getCellTriangles', (t) => {
  function compareObjects(comparedObject, expectedObject) {
    t.equal(comparedObject.ptId0, expectedObject.ptId0);
    t.equal(comparedObject.ptId1, expectedObject.ptId1);
    t.equal(comparedObject.ptId2, expectedObject.ptId2);
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

  t.end();
});
