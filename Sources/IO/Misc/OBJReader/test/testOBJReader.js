import test from 'tape-catch';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkOBJReader from 'vtk.js/Sources/IO/Misc/OBJReader';
import vtkPolyDataNormals from 'vtk.js/Sources/Filters/Core/PolyDataNormals';
import vtkPolyData from '../../../../Common/DataModel/PolyData';

const sampleOBJ = `
# (0,0,0)
v 0.0 0.0 0.0
vt 0.0 0.0
# (1,0,0)
v 1.0 0.0 0.0
vt 1.0 0.0
# (1,1,0)
v 1.0 1.0 0.0
vt 1.0 0.5
vt 1.0 0.0
# (0,1,0)
v 0.0 1.0 0.0
vt 0.0 0.5
vt 0.0 0.0
# (1,1,1)
v 1.0 1.0 1.0
vt 1.0 1.0

f 1/1 2/2 3/3
f 3/3 4/5 1/1
f 4/6 3/4 5/7
`;

test('Test trackDuplicates', (t) => {
  const objReader = vtkOBJReader.newInstance({
    splitMode: 'useMtl',
    trackDuplicates: true,
  });
  objReader.parseAsText(sampleOBJ);
  const polyData = objReader.getOutputData();
  t.deepEqual(vtkOBJReader.getPointDuplicateIds(polyData, 0), [0], '(0, 0)');
  t.deepEqual(vtkOBJReader.getPointDuplicateIds(polyData, 1), [1], '(1, 0)');
  t.deepEqual(vtkOBJReader.getPointDuplicateIds(polyData, 2), [2, 5], '(1, 1)');
  t.deepEqual(vtkOBJReader.getPointDuplicateIds(polyData, 3), [3, 6], '(0, 1)');
  t.deepEqual(
    vtkOBJReader.getPointDuplicateIds(polyData, 5),
    [2, 5],
    "(1, 1)'"
  );
  t.equal(
    polyData.getPointData().getTCoords().getData()[2],
    1.0,
    'tc(1, 1)[0]'
  );
  t.end();
});

test('Test normals with trackDuplicates', (t) => {
  const objReader = vtkOBJReader.newInstance({
    splitMode: 'useMtl',
    trackDuplicates: true,
  });
  objReader.parseAsText(sampleOBJ);
  const polyData = objReader.getOutputData();
  const polys = polyData.getPolys().getData();
  const duplicates = polyData
    .getPointData()
    .getArrayByName('Duplicates')
    .getData();
  const mergedPointsPolysData = new Uint16Array(polys.length);
  let cellSize = 0;
  for (let offset = 0; offset < polys.length; ) {
    cellSize = polys[offset];
    mergedPointsPolysData[offset++] = cellSize;
    for (let pointInCell = 0; pointInCell < cellSize; ++pointInCell) {
      const pointId = polys[offset];
      mergedPointsPolysData[offset++] =
        duplicates[pointId] < pointId ? duplicates[pointId] : pointId;
    }
  }
  const mergedPointsPolyData = vtkPolyData.newInstance();
  mergedPointsPolyData.shallowCopy(polyData);
  const mergedPointsPolys = vtkCellArray.newInstance({
    values: mergedPointsPolysData,
    name: 'faces',
  });
  mergedPointsPolyData.setPolys(mergedPointsPolys);

  const computeNormals = vtkPolyDataNormals.newInstance();
  computeNormals.setInputData(mergedPointsPolyData);
  computeNormals.update();
  const pointNormals = computeNormals
    .getOutputData()
    .getPointData()
    .getNormals();
  polyData.getPointData().setNormals(pointNormals);

  t.deepEqual(
    Array.from(pointNormals.getData().slice(0, 3)),
    [0, 0, 1],
    'normal(0, 0) = (0, 0, 1)'
  );
  t.deepEqual(
    Array.from(pointNormals.getData().slice(3, 6)),
    [0, 0, 1],
    'normal(1, 0) = (0, 0, 1)'
  );
  t.deepEqual(
    Array.from(pointNormals.getData().slice(6, 9)),
    [0, -0.4472135901451111, 0.8944271802902222],
    'normal(1, 1) = (0, -0.4472135901451111, 0.8944271802902222)'
  );
  t.end();
});
