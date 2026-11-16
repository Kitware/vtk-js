import { it, expect } from 'vitest';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkPlanes from 'vtk.js/Sources/Common/DataModel/Planes';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkClipPolyData from 'vtk.js/Sources/Filters/Core/ClipPolyData';

function makePlanes() {
  const points = vtkPoints.newInstance();
  points.setData(new Float32Array([0, 0, 0]), 3);
  const normals = vtkDataArray.newInstance({
    numberOfComponents: 3,
    values: new Float32Array([1, 0, 0]),
  });
  const planes = vtkPlanes.newInstance();
  planes.setPoints(points);
  planes.setNormals(normals);
  return { planes, points, normals };
}

it('getMTime includes the points and the normals', () => {
  const { planes, points, normals } = makePlanes();

  let time = planes.getMTime();
  points.modified();
  expect(planes.getMTime()).toBeGreaterThan(time);

  time = planes.getMTime();
  normals.modified();
  expect(planes.getMTime()).toBeGreaterThan(time);
});

it('getMTime works without points or normals', () => {
  const planes = vtkPlanes.newInstance();
  expect(planes.getMTime()).toBeGreaterThan(0);
});

it('Clip filter executes again when a plane point moves', () => {
  const { planes, points } = makePlanes();

  const quad = vtkPolyData.newInstance();
  quad
    .getPoints()
    .setData(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3);
  quad.getPolys().setData(new Uint32Array([4, 0, 1, 2, 3]));

  const clip = vtkClipPolyData.newInstance({ clipFunction: planes });
  clip.setInputData(quad);
  expect(clip.getOutputData().getBounds()[0]).toBeCloseTo(0);

  // Move the plane from x = 0 to x = 0.5.
  points.setPoint(0, 0.5, 0, 0);
  points.modified();

  expect(clip.getOutputData().getBounds()[0]).toBeCloseTo(0.5);
});
