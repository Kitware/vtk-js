import test from 'tape';
import vtkMergePoints from 'vtk.js/Sources/Common/DataModel/MergePoints';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

// Test 1: Insert unique point
test('vtkMergePoints: insertUniquePoint', (t) => {
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
  t.ok(res1.inserted, 'First insertion should be successful');
  t.equal(res1.id, 0, 'First point ID should be 0');

  const p2 = [1.0, 2.0, 3.0]; // Duplicate point
  const res2 = mergePoints.insertUniquePoint(p2);
  t.notOk(res2.inserted, 'Second insertion should not insert duplicate');
  t.equal(res2.id, 0, 'Should return same ID for duplicate point');

  const p3 = [2.0, 3.0, 4.0]; // Different point
  const res3 = mergePoints.insertUniquePoint(p3);
  t.ok(res3.inserted, 'Different point should insert successfully');
  t.equal(res3.id, 1, 'Should return next ID');

  const p4 = [5.0, 6.0, 7.0]; // Different point
  const res4 = mergePoints.insertUniquePoint(p4);
  t.ok(res4.inserted, 'Different point should insert successfully');
  t.equal(res4.id, 2, 'Should return next ID');
  t.equal(
    mergePoints.getPoints().getNumberOfPoints(),
    3,
    'Three unique points inserted'
  );

  t.end();
});

// Test 2: isInsertedPoint
test('vtkMergePoints: isInsertedPoint', (t) => {
  const mergePoints = vtkMergePoints.newInstance();
  const output = vtkPolyData.newInstance();
  const points = new Float32Array(0);
  output.getPoints().setData(points);
  mergePoints.setDataSet(output);
  mergePoints.setDivisions([10, 10, 10]);
  mergePoints.initPointInsertion(output.getPoints(), output.getBounds());
  mergePoints.buildLocator();

  t.equal(
    mergePoints.isInsertedPoint([0, 0, 0]),
    -1,
    'Non-inserted point returns -1'
  );

  const res = mergePoints.insertUniquePoint([4.0, 5.0, 6.0]);
  t.equal(
    mergePoints.isInsertedPoint([4.0, 5.0, 6.0]),
    res.id,
    'Should return correct ID for inserted point'
  );

  t.end();
});

// Test 3: Duplicate insertions
test('vtkMergePoints: Duplicate insertions', (t) => {
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
  t.ok(res1.inserted, 'First insertion should succeed');
  t.equal(res1.id, 0, 'First point ID should be 0');

  const res2 = mergePoints.insertUniquePoint(p2);
  t.notOk(res2.inserted, 'Duplicate insertion should not insert again');
  t.equal(res2.id, res1.id, 'Should return same ID for duplicate point');

  const res3 = mergePoints.insertUniquePoint(p3);
  t.ok(res3.inserted, 'Unique point should insert successfully');
  t.equal(res3.id, 1, 'Should return next ID for unique point');

  t.end();
});

// Test 4: Fails cleanly on invalid input
test('vtkMergePoints: Invalid input handling', (t) => {
  const mergePoints = vtkMergePoints.newInstance();
  const output = vtkPolyData.newInstance();
  const points = new Float32Array(0);
  output.getPoints().setData(points);
  mergePoints.setDataSet(output);
  mergePoints.setDivisions([10, 10, 10]);
  mergePoints.initPointInsertion(output.getPoints(), output.getBounds());
  mergePoints.buildLocator();

  const res1 = mergePoints.insertUniquePoint(null);
  t.notOk(res1.inserted, 'Should not insert null point');
  t.equal(res1.id, -1, 'Should return -1 for null point');

  const res2 = mergePoints.insertUniquePoint(undefined);
  t.notOk(res2.inserted, 'Should not insert undefined point');
  t.equal(res2.id, -1, 'Should return -1 for undefined point');

  const res3 = mergePoints.insertUniquePoint([1, 2]); // Invalid point
  t.notOk(res3.inserted, 'Should not insert malformed point');
  t.equal(res3.id, -1, 'Should return -1 for malformed point');

  t.end();
});

// Test 5: Spatial hashing with similar points
test('vtkMergePoints: Bucket hashing', (t) => {
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

  t.notEqual(id1, id2, 'Different point should return different ID');
  t.equal(id3, id4, 'Similar points should return same ID');

  t.end();
});
