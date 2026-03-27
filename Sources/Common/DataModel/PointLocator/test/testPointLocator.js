import { it, expect } from 'vitest';
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

it('vtkPointLocator - buildLocator', () => {
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
  expect(
    vtkMath.areEquals(bounds, expectedBounds),
    'Bounds should be calculated correctly'
  ).toBeTruthy();
});

it('vtkPointLocator - insertUniquePoint - new point', () => {
  const points = vtkPoints.newInstance();
  const locator = vtkPointLocator.newInstance();
  const sphereSource = createSphereSource();
  locator.setDataSet(sphereSource.getOutputData());
  locator.initPointInsertion(points, sphereSource.getOutputData().getBounds());
  locator.buildLocator();

  const id = 0;

  const result = locator.insertUniquePoint([1, 2, 3]);

  expect(result.inserted, 'Should insert new point').toBe(true);
  expect(result.id, 'First point should have ID 0').toBe(id);
  expect(locator.getPoints().getNumberOfPoints(), 'Should have 1 point').toBe(
    1
  );
});

it('vtkPointLocator - insertUniquePoint - duplicate point', () => {
  const points = vtkPoints.newInstance();
  const locator = vtkPointLocator.newInstance();
  const sphereSource = createSphereSource();
  locator.setDataSet(sphereSource.getOutputData());
  locator.initPointInsertion(points, sphereSource.getOutputData().getBounds());
  locator.buildLocator();

  const result1 = locator.insertUniquePoint([1, 2, 3]);
  const result2 = locator.insertUniquePoint([1, 2, 3]);

  const id = 0;

  expect(result1.inserted, 'First point should be inserted').toBe(true);
  expect(result1.id, 'First point should have ID 0').toBe(id);
  expect(result2.inserted, 'Second point should not be inserted').toBe(false);
  expect(result2.id, 'Second point should return existing ID').toBe(id);
  expect(
    locator.getPoints().getNumberOfPoints(),
    'Should still have 1 point'
  ).toBe(1);
});

it('vtkPointLocator - isInsertedPoint', () => {
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

  expect(id1, `Should find existing point at ${p1}`).toBe(0);
  expect(id2, `Should find existing point at ${p2}`).toBe(1);
  expect(id3, `Should find existing point at ${p3}`).toBe(2);
  expect(id4, `Should not find point ${p4}`).toBe(-1);
});

it('vtkPointLocator - insertNextPoint', () => {
  const points = vtkPoints.newInstance();
  const locator = vtkPointLocator.newInstance();
  const sphereSource = createSphereSource();
  locator.setDataSet(sphereSource.getOutputData());
  locator.initPointInsertion(points, sphereSource.getOutputData().getBounds());
  locator.buildLocator();

  const result = locator.insertNextPoint([1, 2, 3]);
  expect(result.id, 'First point should have ID 0').toBe(0);
  expect(locator.getPoints().getNumberOfPoints(), 'Should have 1 point').toBe(
    1
  );
  expect(result.inserted, 'Should insert new point').toBe(true);

  const result2 = locator.insertNextPoint([1, 2, 3]);
  expect(result2.id, 'Second point should have ID 1').toBe(1);
  expect(locator.getPoints().getNumberOfPoints(), 'Should have 2 points').toBe(
    2
  );
  expect(result2.inserted, 'Should insert second point').toBe(true);
});

it('vtkPointLocator - findClosestPoint', () => {
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

  expect(
    closestPoint,
    `Closest to [${lookupPoint}] should be point ${closestPoint}`
  ).toEqual(expectedPoint);
});

it('vtkPointLocator - findClosestPointWithinRadius - point found', () => {
  const points = vtkPoints.newInstance();
  const locator = vtkPointLocator.newInstance();
  const sphereSource = createSphereSource();
  locator.setDataSet(sphereSource.getOutputData());
  locator.initPointInsertion(points, sphereSource.getOutputData().getBounds());
  locator.buildLocator();

  const result1 = locator.findClosestPointWithinRadius(0.5, [0.2, 1.0, 1.0]);
  const result2 = locator.findClosestPointWithinRadius(2.0, [1.5, 1.5, 1.5]);

  expect(result1.id, 'Should find closest point within radius').toBe(15);
  expect(
    result1.dist2 < 0.5 * 0.5,
    'Distance should be within radius'
  ).toBeTruthy();
  expect(result2.id, 'Should find closest point within larger radius').toBe(9);
});

it('vtkPointLocator - findClosestPointWithinRadius - no point found', () => {
  const points = vtkPoints.newInstance();
  const locator = vtkPointLocator.newInstance();
  const sphereSource = createSphereSource();
  locator.setDataSet(sphereSource.getOutputData());
  locator.initPointInsertion(points, sphereSource.getOutputData().getBounds());
  locator.buildLocator();

  const result = locator.findClosestPointWithinRadius(0.1, [5, 5, 5]);

  expect(result.id, 'Should not find point outside radius').toBe(-1);
});

it('vtkPointLocator - findClosestInsertedPoint', () => {
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
  expect(closestPoint, 'Closest point should match expected point').toEqual(
    expectedPoint
  );
});
