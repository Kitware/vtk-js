import { it, expect } from 'vitest';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkCell from 'vtk.js/Sources/Common/DataModel/Cell';

it('Test vtkCell instance', () => {
  expect(vtkCell).toBeTruthy();
  const instance = vtkCell.newInstance();
  expect(instance).toBeTruthy();
});

it('Test vtkCell initialize without pointsIds', () => {
  const points = vtkPoints.newInstance();
  points.setData([0, 0, 0, 2, 0, 0, 2, 2, 0]);

  const cell = vtkCell.newInstance();
  cell.initialize(points);

  expect(cell.getPointsIds()[0]).toBe(0);
  expect(cell.getPointsIds()[1]).toBe(1);
  expect(cell.getPointsIds()[2]).toBe(2);
  expect(cell.getPoints().getNumberOfPoints()).toBe(3);
  expect(cell.getPoints()).toBe(points);
});

it('Test vtkCell initialize with pointsIds', () => {
  const points = vtkPoints.newInstance();
  points.setData(Float64Array.from([0, 0, 0, 2, 0, 0, 2, 2, 0]));

  const cell = vtkCell.newInstance();

  cell.initialize(points, [0, 1, 2]);
  expect(cell.getPointsIds().length).toBe(3);
  expect(cell.getPointsIds()[0]).toBe(0);
  expect(cell.getPointsIds()[1]).toBe(1);
  expect(cell.getPointsIds()[2]).toBe(2);
  expect(cell.getPoints()).not.toBe(points);
  expect(cell.getPoints().getNumberOfPoints()).toBe(3);
  expect(cell.getPoints().getPoint(0)).toEqual(points.getPoint(0));
  expect(cell.getPoints().getPoint(1)).toEqual(points.getPoint(1));
  expect(cell.getPoints().getPoint(2)).toEqual(points.getPoint(2));
});

it('Test vtkCell deepCopy', () => {
  const points = vtkPoints.newInstance();
  points.setData([0, 0, 0, 2, 0, 0, 2, 2, 0]);

  const cell = vtkCell.newInstance();
  cell.initialize(points);

  const cell2 = vtkCell.newInstance();
  cell2.deepCopy(cell);
  expect(cell2.getPoints()).not.toBe(points);
  expect(cell2.getPoints().getData()).toEqual(points.getData());
});
