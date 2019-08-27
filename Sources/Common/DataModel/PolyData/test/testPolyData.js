import test from 'tape-catch';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkTriangle from 'vtk.js/Sources/Common/DataModel/Triangle';

test('Test vtkPolyData instance', (t) => {
  t.ok(vtkPolyData, 'Make sure the class definition exists');
  const instance = vtkPolyData.newInstance();
  t.ok(instance);
  t.end();
});

test('Test vtkPolyData cells', (t) => {
  const sphereSource = vtkSphereSource.newInstance({
    thetaResolution: 300,
    phiResolution: 300,
  });
  const polyData = sphereSource.getOutputData();

  console.time('buildCells');
  polyData.buildCells();
  console.timeEnd('buildCells');

  console.time('buildLinks');
  polyData.buildLinks();
  console.timeEnd('buildLinks');

  console.time('getCells with Hint');
  const cell = vtkTriangle.newInstance();
  for (let cellId = 0; cellId < polyData.getNumberOfPolys(); ++cellId) {
    polyData.getCell(cellId, cell);
  }
  console.timeEnd('getCells with Hint');

  console.time('getCells without Hint');
  for (let cellId = 0; cellId < polyData.getNumberOfPolys(); ++cellId) {
    polyData.getCell(cellId);
  }
  console.timeEnd('getCells without Hint');

  t.deepEqual(polyData.getCell(0, cell), cell);
  t.ok(
    polyData.getCell(1).getNumberOfPoints() === 3,
    'cells should be made of 3 points'
  );

  t.end();
});
