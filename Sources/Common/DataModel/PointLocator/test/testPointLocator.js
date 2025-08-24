import test from 'tape';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkPointLocator from 'vtk.js/Sources/Common/DataModel/PointLocator';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';

// Helper function to create test points
function createSphereSource() {
  const sphereSource = vtkSphereSource.newInstance({
    thetaResolution: 8,
    phiResolution: 8,
    radius: 1.0,
  });
  sphereSource.update();
  return sphereSource;
}

test('vtkPointLocator - buildLocator', (t) => {
  const points = vtkPoints.newInstance();
  const locator = vtkPointLocator.newInstance();
  const sphereSource = createSphereSource();
  locator.setDataSet(sphereSource.getOutputData());
  locator.initPointInsertion(points, sphereSource.getOutputData().getBounds());
  locator.buildLocator();
  const bounds = locator.getBounds();
  const expectedBounds = new Float64Array([
    -0.9749279022216797, 0.9749279022216797, -0.9749279022216797,
    0.9749279022216797, -1, 1,
  ]);
  t.ok(
    vtkMath.areEquals(bounds, expectedBounds),
    'Bounds should be calculated correctly'
  );
  t.end();
});

test('vtkPointLocator - insertUniquePoint - new point', (t) => {
  const points = vtkPoints.newInstance();
  const locator = vtkPointLocator.newInstance();
  const sphereSource = createSphereSource();
  locator.setDataSet(sphereSource.getOutputData());
  locator.initPointInsertion(points, sphereSource.getOutputData().getBounds());
  locator.buildLocator();

  const id = 0;

  const result = locator.insertUniquePoint([1, 2, 3]);

  t.equal(result.inserted, true, 'Should insert new point');
  t.equal(result.id, id, 'First point should have ID 0');
  t.equal(locator.getPoints().getNumberOfPoints(), 1, 'Should have 1 point');

  t.end();
});

test('vtkPointLocator - insertUniquePoint - duplicate point', (t) => {
  const points = vtkPoints.newInstance();
  const locator = vtkPointLocator.newInstance();
  const sphereSource = createSphereSource();
  locator.setDataSet(sphereSource.getOutputData());
  locator.initPointInsertion(points, sphereSource.getOutputData().getBounds());
  locator.buildLocator();

  const result1 = locator.insertUniquePoint([1, 2, 3]);
  const result2 = locator.insertUniquePoint([1, 2, 3]);

  const id = 0;

  t.equal(result1.inserted, true, 'First point should be inserted');
  t.equal(result1.id, id, 'First point should have ID 0');
  t.equal(result2.inserted, false, 'Second point should not be inserted');
  t.equal(result2.id, id, 'Second point should return existing ID');
  t.equal(
    locator.getPoints().getNumberOfPoints(),
    1,
    'Should still have 1 point'
  );

  t.end();
});

test('vtkPointLocator - isInsertedPoint', (t) => {
  const points = vtkPoints.newInstance();
  const locator = vtkPointLocator.newInstance();
  const sphereSource = createSphereSource();
  locator.setDataSet(sphereSource.getOutputData());
  locator.initPointInsertion(points, sphereSource.getOutputData().getBounds());
  locator.buildLocator();

  const p1 = [0, 0, 1];
  const p2 = [0.1, 0.1, 0.1];
  const p3 = [0.2, 0.2, 0.2];
  const p4 = [0, 0, 2];

  locator.insertUniquePoint(p1);
  locator.insertUniquePoint(p2);
  locator.insertUniquePoint(p3);

  const id1 = locator.isInsertedPoint(p1);
  const id2 = locator.isInsertedPoint(p2);
  const id3 = locator.isInsertedPoint(p3);
  const id4 = locator.isInsertedPoint(p4);

  t.equal(id1, 0, `Should find existing point at ${p1}`);
  t.equal(id2, 1, `Should find existing point at ${p2}`);
  t.equal(id3, 2, `Should find existing point at ${p3}`);
  t.equal(id4, -1, `Should not find point ${p4}`);

  t.end();
});

test('vtkPointLocator - insertNextPoint', (t) => {
  const points = vtkPoints.newInstance();
  const locator = vtkPointLocator.newInstance();
  const sphereSource = createSphereSource();
  locator.setDataSet(sphereSource.getOutputData());
  locator.initPointInsertion(points, sphereSource.getOutputData().getBounds());
  locator.buildLocator();

  const result = locator.insertNextPoint([1, 2, 3]);
  t.equal(result.id, 0, 'First point should have ID 0');
  t.equal(locator.getPoints().getNumberOfPoints(), 1, 'Should have 1 point');
  t.equal(result.inserted, true, 'Should insert new point');

  const result2 = locator.insertNextPoint([1, 2, 3]);
  t.equal(result2.id, 1, 'Second point should have ID 1');
  t.equal(locator.getPoints().getNumberOfPoints(), 2, 'Should have 2 points');
  t.equal(result2.inserted, true, 'Should insert second point');
  t.end();
});

test('vtkPointLocator - findClosestPoint', (t) => {
  const points = vtkPoints.newInstance();
  const locator = vtkPointLocator.newInstance();
  const sphereSource = createSphereSource();
  locator.setDataSet(sphereSource.getOutputData());
  locator.initPointInsertion(points, sphereSource.getOutputData().getBounds());
  locator.buildLocator();

  const expectedPoint = sphereSource.getOutputData().getPoints().getPoint(45);
  const lookupPoint = [0.1, -0.2, 0.2];
  const closestPointId = locator.findClosestPoint(lookupPoint);
  const closestPoint = sphereSource
    .getOutputData()
    .getPoints()
    .getPoint(closestPointId);

  t.deepEqual(
    closestPoint,
    expectedPoint,
    `Closest to [${lookupPoint}] should be point ${closestPoint}`
  );

  t.end();
});

test('vtkPointLocator - findClosestPointWithinRadius - point found', (t) => {
  const points = vtkPoints.newInstance();
  const locator = vtkPointLocator.newInstance();
  const sphereSource = createSphereSource();
  locator.setDataSet(sphereSource.getOutputData());
  locator.initPointInsertion(points, sphereSource.getOutputData().getBounds());
  locator.buildLocator();

  const result1 = locator.findClosestPointWithinRadius(0.5, [0.2, 1.0, 1.0]);
  const result2 = locator.findClosestPointWithinRadius(2.0, [1.5, 1.5, 1.5]);

  t.equal(result1.id, 15, 'Should find closest point within radius');
  t.ok(result1.dist2 < 0.5 * 0.5, 'Distance should be within radius');
  t.equal(result2.id, 9, 'Should find closest point within larger radius');

  t.end();
});

test('vtkPointLocator - findClosestPointWithinRadius - no point found', (t) => {
  const points = vtkPoints.newInstance();
  const locator = vtkPointLocator.newInstance();
  const sphereSource = createSphereSource();
  locator.setDataSet(sphereSource.getOutputData());
  locator.initPointInsertion(points, sphereSource.getOutputData().getBounds());
  locator.buildLocator();

  const result = locator.findClosestPointWithinRadius(0.1, [5, 5, 5]);

  t.equal(result.id, -1, 'Should not find point outside radius');

  t.end();
});

test('vtkPointLocator - findClosestInsertedPoint', (t) => {
  const points = vtkPoints.newInstance();
  const locator = vtkPointLocator.newInstance();
  const sphereSource = createSphereSource();
  locator.setDataSet(sphereSource.getOutputData());
  locator.initPointInsertion(points, sphereSource.getOutputData().getBounds());
  locator.buildLocator();

  locator.insertUniquePoint([0.8, 0.5, 0.9]);
  const expectedPoint = [0, 0, 1];
  const p1 = [0.6, 0.5, 0.4];
  const ptId = locator.findClosestInsertedPoint(p1);
  const closestPoint = sphereSource.getOutputData().getPoints().getPoint(ptId);
  t.deepEqual(
    closestPoint,
    expectedPoint,
    'Closest point should match expected point'
  );
  t.end();
});
