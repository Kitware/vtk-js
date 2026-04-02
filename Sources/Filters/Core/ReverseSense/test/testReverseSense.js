import test from 'tape';

import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkReverseSense from 'vtk.js/Sources/Filters/Core/ReverseSense';

function createPolyData() {
  const points = vtkPoints.newInstance();
  points.setData(
    new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 1]),
    3
  );

  const verts = vtkCellArray.newInstance();
  verts.insertNextCell([0, 4]);

  const lines = vtkCellArray.newInstance();
  lines.insertNextCell([0, 1, 2]);

  const polys = vtkCellArray.newInstance();
  polys.insertNextCell([0, 1, 2, 3]);

  const strips = vtkCellArray.newInstance();
  strips.insertNextCell([0, 1, 2, 3, 4]);

  const pointNormals = vtkDataArray.newInstance({
    name: 'Normals',
    numberOfComponents: 3,
    values: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1]),
  });

  const cellNormals = vtkDataArray.newInstance({
    name: 'Normals',
    numberOfComponents: 3,
    values: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1]),
  });

  const polyData = vtkPolyData.newInstance();
  polyData.setPoints(points);
  polyData.setVerts(verts);
  polyData.setLines(lines);
  polyData.setPolys(polys);
  polyData.setStrips(strips);
  polyData.getPointData().setNormals(pointNormals);
  polyData.getCellData().setNormals(cellNormals);

  return polyData;
}

test('vtkReverseSense reverses cell connectivity and normals', (t) => {
  const reverseSense = vtkReverseSense.newInstance({
    reverseCells: true,
    reverseNormals: true,
  });
  reverseSense.setInputData(createPolyData());

  const output = reverseSense.getOutputData();

  t.deepEqual(
    Array.from(output.getVerts().getData()),
    [2, 4, 0],
    'reversed verts'
  );
  t.deepEqual(
    Array.from(output.getLines().getData()),
    [3, 2, 1, 0],
    'reversed lines'
  );
  t.deepEqual(
    Array.from(output.getPolys().getData()),
    [4, 3, 2, 1, 0],
    'reversed polys'
  );
  t.deepEqual(
    Array.from(output.getStrips().getData()),
    [5, 4, 3, 2, 1, 0],
    'reversed strips'
  );
  t.deepEqual(
    Array.from(output.getPointData().getNormals().getData()),
    [-1, 0, 0, 0, -1, 0, 0, 0, -1, -1, -1, 0, 0, -1, -1],
    'reversed point normals'
  );
  t.deepEqual(
    Array.from(output.getCellData().getNormals().getData()),
    [-1, 0, 0, 0, -1, 0, 0, 0, -1, -1, -1, -1],
    'reversed cell normals'
  );

  t.end();
});

test('vtkReverseSense leaves normals unchanged when disabled', (t) => {
  const reverseSense = vtkReverseSense.newInstance({
    reverseCells: true,
    reverseNormals: false,
  });
  const input = createPolyData();
  reverseSense.setInputData(input);

  const output = reverseSense.getOutputData();

  t.deepEqual(
    Array.from(output.getPointData().getNormals().getData()),
    Array.from(input.getPointData().getNormals().getData()),
    'point normals are unchanged'
  );
  t.deepEqual(
    Array.from(output.getCellData().getNormals().getData()),
    Array.from(input.getCellData().getNormals().getData()),
    'cell normals are unchanged'
  );

  t.end();
});
