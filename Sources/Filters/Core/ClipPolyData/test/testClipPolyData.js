import { it, expect } from 'vitest';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkClipPolyData from 'vtk.js/Sources/Filters/Core/ClipPolyData';

function createSquareAsTriangles() {
  const points = vtkPoints.newInstance();
  points.insertNextPoint(-1, 0, 0);
  points.insertNextPoint(1, 0, 0);
  points.insertNextPoint(1, 1, 0);
  points.insertNextPoint(-1, 1, 0);

  const polys = vtkCellArray.newInstance();
  polys.insertNextCell([0, 1, 2]);
  polys.insertNextCell([0, 2, 3]);

  const polydata = vtkPolyData.newInstance();
  polydata.setPoints(points);
  polydata.setPolys(polys);
  polydata.getPointData().setScalars(
    vtkDataArray.newInstance({
      name: 'inputScalars',
      values: new Float32Array([-1, 1, 1, -1]),
      numberOfComponents: 1,
    })
  );

  return polydata;
}

it('vtkClipPolyData clips a triangle mesh and produces clipped output', () => {
  const plane = vtkPlane.newInstance({
    origin: [0, 0, 0],
    normal: [1, 0, 0],
  });

  const clipper = vtkClipPolyData.newInstance({
    clipFunction: plane,
    generateClipScalars: true,
    generateClippedOutput: true,
  });

  clipper.setInputData(createSquareAsTriangles());

  const kept = clipper.getOutputData();
  const clipped = clipper.getOutputData(1);

  expect(
    kept.getNumberOfPolys(),
    'kept side is triangulated into 3 polys'
  ).toBe(3);
  expect(
    clipped.getNumberOfPolys(),
    3,
    'clipped side is triangulated into 3 polys'
  ).toBe(3);
  expect(
    kept.getNumberOfPoints(),
    7,
    'shared point set contains originals and intersections'
  ).toBe(7);
  expect(clipped.getNumberOfPoints(), 'clipped output shares point set').toBe(
    7
  );

  const keptScalars = kept.getPointData().getScalars().getData();
  expect(keptScalars.length, 'generated clip scalars were attached').toBe(7);
  expect(
    Array.from(keptScalars).includes(0),
    'intersection points carry the clip value'
  ).toBeTruthy();
});
