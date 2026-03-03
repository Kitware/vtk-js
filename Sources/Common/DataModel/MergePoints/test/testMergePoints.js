import { it, expect } from 'vitest';
import vtkMergePoints from 'vtk.js/Sources/Common/DataModel/MergePoints';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

// Test 1: Insert unique point
it('vtkMergePoints: insertUniquePoint', () => {
  const mergePoints = vtkMergePoints.newInstance();
  const output = vtkPolyData.newInstance();
  const points = new Float32Array(0);
  output.getPoints().setData(points);
  mergePoints.setDataSet(output);
  mergePoints.setDivisions([10, 10, 10]);
  mergePoints.initPointInsertion(output.getPoints(), output.getBounds());
  mergePoints.buildLocator();

  const p1 = [1.0, 2.0, 3.0]; // First unique point
  const res1 = mergePoints.insertUniquePoint(p1);
  expect(res1.inserted).toBeTruthy();
  expect(res1.id).toBe(0);

  const p2 = [1.0, 2.0, 3.0]; // Duplicate point
  const res2 = mergePoints.insertUniquePoint(p2);
  expect(res2.inserted).toBeFalsy();
  expect(res2.id).toBe(0);

  const p3 = [2.0, 3.0, 4.0]; // Different point
  const res3 = mergePoints.insertUniquePoint(p3);
  expect(res3.inserted).toBeTruthy();
  expect(res3.id).toBe(1);

  const p4 = [5.0, 6.0, 7.0]; // Different point
  const res4 = mergePoints.insertUniquePoint(p4);
  expect(res4.inserted).toBeTruthy();
  expect(res4.id).toBe(2);
  expect(mergePoints.getPoints().getNumberOfPoints()).toBe(3);
});

// Test 2: isInsertedPoint
it('vtkMergePoints: isInsertedPoint', () => {
  const mergePoints = vtkMergePoints.newInstance();
  const output = vtkPolyData.newInstance();
  const points = new Float32Array(0);
  output.getPoints().setData(points);
  mergePoints.setDataSet(output);
  mergePoints.setDivisions([10, 10, 10]);
  mergePoints.initPointInsertion(output.getPoints(), output.getBounds());
  mergePoints.buildLocator();

  expect(mergePoints.isInsertedPoint([0, 0, 0])).toBe(-1);

  const res = mergePoints.insertUniquePoint([4.0, 5.0, 6.0]);
  expect(mergePoints.isInsertedPoint([4.0, 5.0, 6.0])).toBe(res.id);
});

// Test 3: Duplicate insertions
it('vtkMergePoints: Duplicate insertions', () => {
  const mergePoints = vtkMergePoints.newInstance();
  const output = vtkPolyData.newInstance();
  const points = new Float32Array(0);
  output.getPoints().setData(points);
  mergePoints.setDataSet(output);
  mergePoints.setDivisions([10, 10, 10]);
  mergePoints.initPointInsertion(output.getPoints(), output.getBounds());
  mergePoints.buildLocator();

  const p1 = [1.0, 2.0, 3.0];
  const p2 = [1.0, 2.0, 3.0]; // Duplicate
  const p3 = [2.0, 3.0, 4.0]; // Unique

  const res1 = mergePoints.insertUniquePoint(p1);
  expect(res1.inserted).toBeTruthy();
  expect(res1.id).toBe(0);

  const res2 = mergePoints.insertUniquePoint(p2);
  expect(res2.inserted).toBeFalsy();
  expect(res2.id).toBe(res1.id);

  const res3 = mergePoints.insertUniquePoint(p3);
  expect(res3.inserted).toBeTruthy();
  expect(res3.id).toBe(1);
});

// Test 4: Fails cleanly on invalid input
it('vtkMergePoints: Invalid input handling', () => {
  const mergePoints = vtkMergePoints.newInstance();
  const output = vtkPolyData.newInstance();
  const points = new Float32Array(0);
  output.getPoints().setData(points);
  mergePoints.setDataSet(output);
  mergePoints.setDivisions([10, 10, 10]);
  mergePoints.initPointInsertion(output.getPoints(), output.getBounds());
  mergePoints.buildLocator();

  const res1 = mergePoints.insertUniquePoint(null);
  expect(res1.inserted).toBeFalsy();
  expect(res1.id).toBe(-1);

  const res2 = mergePoints.insertUniquePoint(undefined);
  expect(res2.inserted).toBeFalsy();
  expect(res2.id).toBe(-1);

  const res3 = mergePoints.insertUniquePoint([1, 2]); // Invalid point
  expect(res3.inserted).toBeFalsy();
  expect(res3.id).toBe(-1);
});

// Test 5: Spatial hashing with similar points
it('vtkMergePoints: Bucket hashing', () => {
  const mergePoints = vtkMergePoints.newInstance();
  const output = vtkPolyData.newInstance();
  const points = new Float32Array(0);

  output.getPoints().setData(points);
  mergePoints.setDataSet(output);
  mergePoints.setDivisions([10, 10, 10]);
  mergePoints.initPointInsertion(output.getPoints(), output.getBounds());
  mergePoints.buildLocator();

  const p1 = [1.4, 2.6, 3.9];
  const p2 = [1.5, 2.7, 3.1];
  const p3 = [1.0, 2.0, 4.0];
  const p4 = [1.0, 2.0, 4.0];

  const id1 = mergePoints.insertUniquePoint(p1).id;
  const id2 = mergePoints.insertUniquePoint(p2).id;
  const id3 = mergePoints.insertUniquePoint(p3).id;
  const id4 = mergePoints.insertUniquePoint(p4).id;

  expect(id1).not.toBe(id2);
  expect(id3).toBe(id4);
});
