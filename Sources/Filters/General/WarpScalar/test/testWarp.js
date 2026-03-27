import { it, expect } from 'vitest';
import vtkWarpScalar from 'vtk.js/Sources/Filters/General/WarpScalar';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';

it('Test vtkWarpScalar instance', () => {
  expect(vtkWarpScalar, 'Make sure the class definition exist').toBeTruthy();
  const instance = vtkWarpScalar.newInstance();
  expect(instance, 'Make sure the instance exist').toBeTruthy();

  expect(instance.getScaleFactor(), 'Default ScaleFactor should be 1').toBe(1);
  expect(instance.getUseNormal(), 'Default UseNormal should be false').toBe(
    false
  );
  expect(instance.getXyPlane(), 'Default xyPlane should be false').toBe(false);
  expect(instance.getNormal(), 'Default normal should be [0, 0, 1]').toEqual([
    0, 0, 1,
  ]);

  instance.setScaleFactor(2.5);
  expect(
    instance.getScaleFactor(),
    'Updated value of ScaleFactor should be 2.5'
  ).toBe(2.5);
});

it('Test vtkWarpScalar execution', () => {
  const source = vtkSphereSource.newInstance();
  const filter = vtkWarpScalar.newInstance();
  filter.setInputConnection(source.getOutputPort());
  source.update();
  filter.update();
  const input = source.getOutputData();
  const output = filter.getOutputData();

  expect(output, 'Output dataset exist').toBeTruthy();
  expect(
    output.isA('vtkPolyData'),
    'The output dataset should be a vtkPolydata'
  ).toBe(true);
  expect(
    input.getPoints().getNumberOfPoints(),
    `The number of points do not change between input ${input
      .getPoints()
      .getNumberOfPoints()} and output ${output
      .getPoints()
      .getNumberOfPoints()}`
  ).toBe(output.getPoints().getNumberOfPoints());
});
