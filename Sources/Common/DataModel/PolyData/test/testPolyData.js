import test from 'tape-catch';
import vtkLine from 'vtk.js/Sources/Common/DataModel/Line';
import vtkTriangle from 'vtk.js/Sources/Common/DataModel/Triangle';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

test('Test vtkPolyData instance', (t) => {
  t.ok(vtkPolyData, 'Make sure the class definition exists');
  const instance = vtkPolyData.newInstance();
  t.ok(instance);
  t.end();
});

test('Test vtkPolyData cells', (t) => {
  const polyData = vtkPolyData.newInstance();

  const pointCount = 3 * 200; // Must be a multiple of 3
  const points = new Float32Array(pointCount * 3);
  // Create a perimeter multi-line
  const edges = new Uint32Array(pointCount + 2);
  edges[0] = pointCount + 1;
  edges[pointCount] = 0;
  // Create triangles
  const triangles = new Uint32Array(pointCount / 3);
  let tIndex = 0;
  for (let i = 0; i < pointCount; i++) {
    const radius = i % 2 === 1 ? 2 : 0.8;
    points[3 * i + 0] = radius * Math.cos(((2 * i - 1) * Math.PI) / pointCount);
    points[3 * i + 1] = radius * Math.sin(((2 * i - 1) * Math.PI) / pointCount);
    points[3 * i + 2] = 0;

    edges[1 + i] = i;
    if (i % 3 === 0) {
      triangles[tIndex++] = 3;
    }
    triangles[tIndex++] = i;
  }

  polyData.getPoints().setData(points, 3);
  polyData.getLines().setData(edges, 1);
  polyData.getPolys().setData(triangles, 1);

  console.time('buildCells');
  polyData.buildCells();
  console.timeEnd('buildCells');

  console.time('buildLinks');
  polyData.buildLinks();
  console.timeEnd('buildLinks');

  const firstLineCell = 0;
  const firstPolyCell = firstLineCell + polyData.getNumberOfLines();

  t.ok(
    polyData.getCell(firstLineCell).getNumberOfPoints() === pointCount + 1,
    'Line cell should be made of the number of points plus 1'
  );
  t.ok(
    polyData.getCell(firstPolyCell).getNumberOfPoints() === 3,
    'Triangle cells should be made of 3 points'
  );

  // Test performance on getCells with or without hint:

  // Lines
  console.time('Line getCells with Hint');
  const line = vtkLine.newInstance();
  for (let cellId = 0; cellId < polyData.getNumberOfLines(); ++cellId) {
    polyData.getCell(cellId, line);
  }
  console.timeEnd('Line getCells with Hint');

  console.time('Line getCells without Hint');
  for (let cellId = 0; cellId < polyData.getNumberOfLines(); ++cellId) {
    polyData.getCell(cellId);
  }
  console.timeEnd('Line getCells without Hint');

  // Polys
  console.time('getCells with Hint');
  const triangle = vtkTriangle.newInstance();
  for (let cellId = 0; cellId < polyData.getNumberOfPolys(); ++cellId) {
    polyData.getCell(cellId + firstPolyCell, triangle);
  }
  console.timeEnd('getCells with Hint');

  console.time('getCells without Hint');
  for (let cellId = 0; cellId < polyData.getNumberOfPolys(); ++cellId) {
    polyData.getCell(cellId + firstPolyCell);
  }
  console.timeEnd('getCells without Hint');

  // Test consistent results
  t.deepEqual(polyData.getCell(firstPolyCell, triangle), triangle);

  t.end();
});
