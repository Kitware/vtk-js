import { it, expect } from 'vitest';
import vtkWarpScalar from 'vtk.js/Sources/Filters/General/WarpScalar';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';

it('Test vtkWarpScalar instance', () => {
  expect(vtkWarpScalar).toBeTruthy();
  const instance = vtkWarpScalar.newInstance();
  expect(instance).toBeTruthy();

  expect(instance.getScaleFactor()).toBe(1);
  expect(instance.getUseNormal()).toBe(false);
  expect(instance.getXyPlane()).toBe(false);
  expect(instance.getNormal()).toEqual([0, 0, 1]);

  instance.setScaleFactor(2.5);
  expect(instance.getScaleFactor()).toBe(2.5);
});

it('Test vtkWarpScalar execution', () => {
  const source = vtkSphereSource.newInstance();
  const filter = vtkWarpScalar.newInstance();
  filter.setInputConnection(source.getOutputPort());
  source.update();
  filter.update();
  const input = source.getOutputData();
  const output = filter.getOutputData();

  expect(output).toBeTruthy();
  expect(output.isA('vtkPolyData')).toBe(true);
  expect(input.getPoints().getNumberOfPoints()).toBe(
    output.getPoints().getNumberOfPoints()
  );
});
