import test from 'tape-catch';
import vtkOBJReader from 'vtk.js/Sources/IO/Misc/OBJReader';

const sampleOBJ = `
v 0.0 0.0 0.0
v 1.0 0.0 0.0
v 1.0 1.0 0.0
v 0.0 1.0 0.0

vt 0.0 0.0
vt 1.0 0.0
vt 0.0 0.0
vt 1.0 1.0
vt 0.0 0.0
vt 0.0 1.0
vt 0.0 0.0

f 1/1 2/2 3/4
f 3/5 4/6 1/1
`;

test('Test trackDuplicates', (t) => {
  const objReader = vtkOBJReader.newInstance({
    splitMode: 'useMtl',
    trackDuplicates: true,
  });
  objReader.parseAsText(sampleOBJ);
  const polyData = objReader.getOutputData();
  console.log('v ', polyData.getPoints().getData());
  console.log('tc ', polyData.getPointData().getTCoords().getData());
  t.deepEqual(vtkOBJReader.getPointDuplicateIds(polyData, 0), [0], 'point 0');
  t.deepEqual(vtkOBJReader.getPointDuplicateIds(polyData, 1), [1], 'point 1');
  t.deepEqual(
    vtkOBJReader.getPointDuplicateIds(polyData, 2),
    [2, 4],
    'point 2'
  );
  t.deepEqual(vtkOBJReader.getPointDuplicateIds(polyData, 3), [3], 'point 3');
  t.deepEqual(
    vtkOBJReader.getPointDuplicateIds(polyData, 4),
    [2, 4],
    'point 4'
  );
  t.equal(
    polyData.getPointData().getTCoords().getData()[2],
    1.0,
    '2nd point tc[0]'
  );
  t.end();
});
