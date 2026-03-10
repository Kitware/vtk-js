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
  expect(res1.inserted, 'First insertion should be successful').toBeTruthy();
  expect(res1.id, 'First point ID should be 0').toBe(0);

  const p2 = [1.0, 2.0, 3.0]; // Duplicate point
  const res2 = mergePoints.insertUniquePoint(p2);
  expect(
    res2.inserted,
    'Second insertion should not insert duplicate'
  ).toBeFalsy();
  expect(res2.id, 'Should return same ID for duplicate point').toBe(0);

  const p3 = [2.0, 3.0, 4.0]; // Different point
  const res3 = mergePoints.insertUniquePoint(p3);
  expect(
    res3.inserted,
    'Different point should insert successfully'
  ).toBeTruthy();
  expect(res3.id, 'Should return next ID').toBe(1);

  const p4 = [5.0, 6.0, 7.0]; // Different point
  const res4 = mergePoints.insertUniquePoint(p4);
  expect(
    res4.inserted,
    'Different point should insert successfully'
  ).toBeTruthy();
  expect(res4.id, 'Should return next ID').toBe(2);
  expect(
    mergePoints.getPoints().getNumberOfPoints(),
    'Three unique points inserted'
  ).toBe(3);
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

  expect(
    mergePoints.isInsertedPoint([0, 0, 0]),
    'Non-inserted point returns -1'
  ).toBe(-1);

  const res = mergePoints.insertUniquePoint([4.0, 5.0, 6.0]);
  expect(
    mergePoints.isInsertedPoint([4.0, 5.0, 6.0]),
    'Should return correct ID for inserted point'
  ).toBe(res.id);
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
  expect(res1.inserted, 'First insertion should succeed').toBeTruthy();
  expect(res1.id, 'First point ID should be 0').toBe(0);

  const res2 = mergePoints.insertUniquePoint(p2);
  expect(
    res2.inserted,
    'Duplicate insertion should not insert again'
  ).toBeFalsy();
  expect(res2.id, 'Should return same ID for duplicate point').toBe(res1.id);

  const res3 = mergePoints.insertUniquePoint(p3);
  expect(res3.inserted, 'Unique point should insert successfully').toBeTruthy();
  expect(res3.id, 'Should return next ID for unique point').toBe(1);
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
  expect(res1.inserted, 'Should not insert null point').toBeFalsy();
  expect(res1.id, 'Should return -1 for null point').toBe(-1);

  const res2 = mergePoints.insertUniquePoint(undefined);
  expect(res2.inserted, 'Should not insert undefined point').toBeFalsy();
  expect(res2.id, 'Should return -1 for undefined point').toBe(-1);

  const res3 = mergePoints.insertUniquePoint([1, 2]); // Invalid point
  expect(res3.inserted, 'Should not insert malformed point').toBeFalsy();
  expect(res3.id, 'Should return -1 for malformed point').toBe(-1);
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

  expect(id1, 'Different point should return different ID').not.toBe(id2);
  expect(id3, 'Similar points should return same ID').toBe(id4);
});
