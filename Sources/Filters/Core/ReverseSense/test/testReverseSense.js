import { it, expect } from 'vitest';

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

it('vtkReverseSense reverses cell connectivity and normals', () => {
  const reverseSense = vtkReverseSense.newInstance({
    reverseCells: true,
    reverseNormals: true,
  });
  reverseSense.setInputData(createPolyData());

  const output = reverseSense.getOutputData();

  expect(Array.from(output.getVerts().getData()), 'reversed verts').toEqual([
    2, 4, 0,
  ]);
  expect(Array.from(output.getLines().getData()), 'reversed lines').toEqual([
    3, 2, 1, 0,
  ]);
  expect(Array.from(output.getPolys().getData()), 'reversed polys').toEqual([
    4, 3, 2, 1, 0,
  ]);
  expect(Array.from(output.getStrips().getData()), 'reversed strips').toEqual([
    5, 4, 3, 2, 1, 0,
  ]);
  expect(
    Array.from(output.getPointData().getNormals().getData()),
    'reversed point normals'
  ).toEqual([-1, 0, 0, 0, -1, 0, 0, 0, -1, -1, -1, 0, 0, -1, -1]);
  expect(
    Array.from(output.getCellData().getNormals().getData()),
    'reversed cell normals'
  ).toEqual([-1, 0, 0, 0, -1, 0, 0, 0, -1, -1, -1, -1]);
});

it('vtkReverseSense leaves normals unchanged when disabled', () => {
  const reverseSense = vtkReverseSense.newInstance({
    reverseCells: true,
    reverseNormals: false,
  });
  const input = createPolyData();
  reverseSense.setInputData(input);

  const output = reverseSense.getOutputData();

  expect(
    Array.from(output.getPointData().getNormals().getData()),
    'point normals are unchanged'
  ).toEqual(Array.from(input.getPointData().getNormals().getData()));
  expect(
    Array.from(output.getCellData().getNormals().getData()),
    'cell normals are unchanged'
  ).toEqual(Array.from(input.getCellData().getNormals().getData()));
});
