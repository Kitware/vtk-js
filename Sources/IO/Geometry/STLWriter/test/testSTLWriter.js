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

it('vtkSTLWriter makes the binary buffer from the triangle count', () => {
  const polyData = vtkPolyData.newInstance();
  polyData
    .getPoints()
    .setData(new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0]), 3);
  // One quad. A quad is two triangles in STL.
  polyData.getPolys().setData(new Uint32Array([4, 1, 2, 3, 0]));
  const view = vtkSTLWriter.writeSTL(polyData, FormatTypes.BINARY);
  expect(view.byteLength).toBe(80 + 4 + 50 * 2);
});

it('vtkSTLWriter writes the triangle count as the facet count', () => {
  const polyData = vtkPolyData.newInstance();
  polyData
    .getPoints()
    .setData(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), 3);
  polyData.getPolys().setData(new Uint32Array([3, 0, 1, 2]));
  // One vertex cell and one line cell. STL does not write them.
  polyData.getVerts().setData(new Uint32Array([1, 0]));
  polyData.getLines().setData(new Uint32Array([2, 0, 1]));
  const view = vtkSTLWriter.writeSTL(polyData, FormatTypes.BINARY);
  expect(view.getUint32(80, true)).toBe(1);
  expect((view.byteLength - 84) / 50).toBe(1);
});
