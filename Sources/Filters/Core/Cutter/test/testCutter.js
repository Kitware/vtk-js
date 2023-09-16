import test from 'tape-catch';

import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';
import vtkCutter from 'vtk.js/Sources/Filters/Core/Cutter';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';

test('Test vtkCutter cutCube', (t) => {
  const plane = vtkPlane.newInstance();
  plane.setNormal(1.0, 0.0, 0.0);
  plane.setOrigin(0.0, 0.0, 0.0);

  const cube = vtkCubeSource.newInstance();

  const cutter = vtkCutter.newInstance();
  cutter.setCutFunction(plane);
  cutter.setInputData(cube.getOutputData());
  cutter.update();

  const cutCube = cutter.getOutputData();
  const points = cutCube.getPoints();
  const lines = cutCube.getLines();
  t.equal(points.getNumberOfPoints(), 4);
  t.equal(lines.getNumberOfCells(), 4);
  // Check the generated points
  const correctPoints = [
    [0, -0.5, 0.5],
    [0, -0.5, -0.5],
    [0, 0.5, -0.5],
    [0, 0.5, 0.5],
  ];
  correctPoints.forEach((correctPoint) => {
    const pointId = points.findPoint(correctPoint);
    t.ok(pointId > -1);
  });
  t.end();
});
