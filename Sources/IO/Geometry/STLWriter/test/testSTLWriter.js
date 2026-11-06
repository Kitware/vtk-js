import { it, expect } from 'vitest';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkSTLWriter from 'vtk.js/Sources/IO/Geometry/STLWriter';
import { FormatTypes } from 'vtk.js/Sources/IO/Geometry/STLWriter/Constants';

function makeQuadAndTriangle() {
  const polyData = vtkPolyData.newInstance();
  polyData
    .getPoints()
    .setData(
      new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 2, 0, 0]),
      3
    );
  // One quad, then one triangle.
  polyData.getPolys().setData(new Uint32Array([4, 0, 1, 2, 3, 3, 1, 4, 2]));
  return polyData;
}

function getVertices(text) {
  return text
    .split('\n')
    .filter((l) => l.trim().startsWith('vertex'))
    .map((l) => l.trim());
}

it('vtkSTLWriter splits polygons into a triangle fan', () => {
  const text = vtkSTLWriter.writeSTL(makeQuadAndTriangle(), FormatTypes.ASCII);
  expect(text.match(/endfacet/g).length).toBe(3);
  const v = (x, y) => `vertex ${x.toPrecision(6)} ${y.toPrecision(6)} 0.00000`;
  expect(getVertices(text)).toEqual([
    v(0, 0),
    v(1, 0),
    v(1, 1),
    v(0, 0),
    v(1, 1),
    v(0, 1),
    v(1, 0),
    v(2, 0),
    v(1, 1),
  ]);
});
