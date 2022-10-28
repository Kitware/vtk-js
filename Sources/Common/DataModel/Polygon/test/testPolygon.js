import test from 'tape-catch';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkPolygon from 'vtk.js/Sources/Common/DataModel/Polygon';
import {
  PolygonWithPointIntersectionState,
  PolygonWithCellIntersectionState,
  EPSILON,
} from 'vtk.js/Sources/Common/DataModel/Polygon/Constants';

test('Test vtkPolygon instance', (t) => {
  t.ok(vtkPolygon, 'Make sure the class definition exists');
  const instance = vtkPolygon.newInstance();
  t.ok(instance);
  t.end();
});

test('Test vtkPolygon computeNormal', (t) => {
  const polygon = vtkPolygon.newInstance();

  const poly = [
    [0, 0, 0],
    [3, 0, 0],
    [3, 3, 3],
    [0, 3, 3],
  ];
  polygon.setPoints(poly);

  t.ok(
    polygon.computeNormal() - 25.455844 < EPSILON &&
      vtkMath.areEquals(
        polygon.get().normal,
        [0, -0.7071067811865476, 0.7071067811865476]
      )
  );

  t.end();
});

test('Test vtkPolygon computeCentroid', (t) => {
  const polygon = vtkPolygon.newInstance();

  let poly = [
    [0, 0, 0],
    [3, 0, 0],
    [3, 3, 3],
    [0, 3, 3],
  ];
  polygon.setPoints(poly);

  t.ok(
    vtkMath.areEquals([1.5, 1.5, 1.5], polygon.computeCentroid(), EPSILON),
    'centroid should be [1.5, 1.5, 1.5]'
  );

  // Same points but in a different order to test degenerate polygon
  poly = [
    [0, 0, 0],
    [3, 0, 0],
    [0, 3, 3],
    [3, 3, 3],
  ];
  polygon.setPoints(poly);

  t.ok(
    polygon.computeCentroid() === null,
    'giving degenerate polygon returns null'
  );

  t.end();
});

test('Test vtkPolygon computeArea', (t) => {
  const polygon = vtkPolygon.newInstance();

  polygon.setPoints([
    [0, 10, 0],
    [0, 0, 1],
  ]);

  t.ok(
    polygon.computeArea() < EPSILON,
    'Area of polygon with less than 3 points should be 0'
  );

  let poly = [
    [0, 0, 0],
    [3, 0, 0],
    [3, 3, 3],
    [0, 3, 3],
  ];
  polygon.setPoints(poly);

  t.ok(
    polygon.computeArea() - 3 * 3 * 2 * Math.sqrt(2) < EPSILON,
    'Area should be 3*3*2*sqrt(2)'
  );

  // Same points but in a different order to test degenerate polygon
  poly = [
    [0, 0, 0],
    [3, 0, 0],
    [0, 3, 3],
    [3, 3, 3],
  ];
  polygon.setPoints(poly);
  t.ok(Number.isNaN(polygon.computeArea()), 'Area of degenerate area is NaN');

  t.end();
});

test('Test vtkPolygon distanceToPolygon', (t) => {
  const polygon = vtkPolygon.newInstance();

  const poly = [
    [0, 0, 0],
    [3, 0, 0],
    [3, 3, 3],
    [0, 3, 3],
  ];
  polygon.setPoints(poly);

  const closest = [0, 0, 0];
  let distToPolygon = polygon.distanceToPolygon([1.5, 1.5, 1.5], closest);
  t.ok(
    distToPolygon.t - Number.MIN_VALUE < EPSILON &&
      distToPolygon.distance === 0 &&
      vtkMath.areEquals([1.5, 1.5, 1.5], closest),
    'Inside Polygon'
  );

  distToPolygon = polygon.distanceToPolygon([1.5, 0, -3], closest);
  t.ok(
    distToPolygon.t - 1.5 < EPSILON &&
      distToPolygon.distance - 3 < EPSILON &&
      vtkMath.areEquals([1.5, 0, 0], closest), // TBD
    'Point outside polygon'
  );

  t.end();
});

test('Test vtkPolygon triangulate', (t) => {
  const polygon = vtkPolygon.newInstance();

  let poly = [
    [0, 0, 0],
    [3, 0, 0],
    [3, 3, 3],
    [0, 3, 3],
  ];
  polygon.setPoints(poly);
  let triangulation = polygon.triangulate();
  let expected = [0, 0, 0, 3, 0, 0, 0, 3, 3, 3, 3, 3, 0, 3, 3, 3, 0, 0];
  t.ok(vtkMath.areEquals(triangulation, expected), 'Polygon with 4 points');
  poly = [
    [0, 0, 0],
    [1, 2, 1],
    [2, 0, 0],
    [1, 3, 1],
  ];
  polygon.setPoints(poly);

  triangulation = polygon.triangulate();
  expected = [0, 0, 0, 1, 2, 1, 1, 3, 1, 2, 0, 0, 1, 3, 1, 1, 2, 1];

  t.ok(
    vtkMath.areEquals(triangulation, expected),
    'Can triangulate non convex polygon'
  );

  poly = [
    [1, 0, 0],
    [2, 0, 0],
    [3, 1, 0],
    [3, 2, 0],
    [2, 3, 0],
    [1, 3, 0],
    [0, 2, 0],
    [0, 1, 0],
  ];
  polygon.setPoints(poly);

  triangulation = polygon.triangulate();
  // prettier-ignore
  expected = [
    1, 0, 0,
    2, 0, 0,
    0, 1, 0,
    0, 2, 0,
    0, 1, 0,
    1, 3, 0,
    2, 3, 0,
    1, 3, 0,
    3, 2, 0,
    3, 1, 0,
    3, 2, 0,
    2, 0, 0,
    1, 3, 0,
    0, 1, 0,
    3, 2, 0,
    2, 0, 0,
    3, 2, 0,
    0, 1, 0,
  ];
  t.ok(vtkMath.areEquals(triangulation, expected), 'Can triangulate');

  poly = [
    [0, 0, 0],
    [3, 0, 0],
    [0, 3, 3],
    [3, 3, 3],
  ];
  polygon.setPoints(poly);

  triangulation = polygon.triangulate();
  t.ok(triangulation === null, 'Cannot triangulate degenerate polygon');

  poly = [
    [0, 1, 2],
    [3, 4, 5],
  ];
  polygon.setPoints(poly);
  triangulation = polygon.triangulate();
  t.ok(triangulation === null, 'Cannot triangulate polygon with 2 points');

  t.end();
});

test('Test vtkPolygon pointInPolygon', (t) => {
  const polygon = vtkPolygon.newInstance();
  let poly = [
    [0, 0, 0],
    [3, 0, 0],
    [3, 3, 3],
    [0, 3, 3],
  ];
  polygon.setPoints(poly);

  t.ok(
    polygon.pointInPolygon([1.5, 1.5, 1.5]) ===
      PolygonWithPointIntersectionState.INSIDE,
    '[1.5,1.5,1.5] is in polygon'
  );
  t.ok(
    polygon.pointInPolygon([5, 5, 5]) ===
      PolygonWithPointIntersectionState.OUTSIDE,
    '[5,5,5] is not in polygon'
  );
  t.ok(
    polygon.pointInPolygon([1.5, 0, 0]) ===
      PolygonWithPointIntersectionState.INSIDE,
    '[1.5,0,0] is on edge of polygon (considered inside)'
  );
  // Same points but in a different order to test degenerate polygon
  poly = [
    [0, 0, 0],
    [3, 0, 0],
    [0, 3, 3],
    [3, 3, 3],
  ];
  polygon.setPoints(poly);

  t.end();
});

test('Test vtkPolygon isConvex', (t) => {
  const polygon = vtkPolygon.newInstance();

  let poly = [
    [0, 0, 0],
    [3, 0, 0],
    [3, 3, 3],
    [0, 3, 3],
  ];
  polygon.setPoints(poly);

  t.ok(polygon.isConvex(), 'convex polygon');
  poly = [
    [0, 0, 0],
    [1, 2, 1],
    [2, 0, 0],
    [1, 3, 1],
  ];
  polygon.setPoints(poly);

  t.ok(!polygon.isConvex(), 'non convex polygon');

  // Same points but in a different order to test degenerate polygon
  poly = [
    [0, 0, 0],
    [3, 0, 0],
    [0, 3, 3],
    [3, 3, 3],
  ];
  polygon.setPoints(poly);
  t.ok(!polygon.isConvex(), 'degenerate polygon');

  t.end();
});

test('Test vtkPolygon interpolateFunctions', (t) => {
  const polygon = vtkPolygon.newInstance();

  let poly = [
    [0, 0, 0],
    [3, 0, 0],
    [3, 3, 3],
    [0, 3, 3],
  ];
  polygon.setPoints(poly);

  t.ok(
    vtkMath.areEquals(
      polygon.interpolateFunctions([1.5, 1.5, 1.5], false),
      [0.25, 0.25, 0.25, 0.25]
    ),
    'convex polygon'
  );

  // Test for MVC method
  t.ok(
    vtkMath.areEquals(
      polygon.interpolateFunctions([1.5, 1.5, 1.5], true),
      [0.25, 0.25, 0.25, 0.25]
    ),
    'convex polygon MVC'
  );

  t.ok(
    vtkMath.areEquals(
      polygon.interpolateFunctions(
        [3 + EPSILON, 3 + EPSILON, 3 + EPSILON],
        false
      ),
      [0, 0, 1, 0]
    ),
    'interpolate point close to one of the polygon point'
  );

  t.ok(
    vtkMath.areEquals(
      polygon.interpolateFunctions(
        [
          3 + (1 / Math.sqrt(3)) * EPSILON,
          3 + (1 / Math.sqrt(3)) * EPSILON,
          3 + (1 / Math.sqrt(3)) * EPSILON,
        ],
        true
      ),
      [0, 0, 1, 0]
    ),
    'interpolate point close to one of the point of the polygon, MVC interpolation'
  );

  // Same points but in a different order to test degenerate polygon
  poly = [
    [0, 0, 0],
    [3, 0, 0],
    [0, 3, 3],
    [3, 3, 3],
  ];
  polygon.setPoints(poly);
  t.ok(
    vtkMath.areEquals(
      polygon.interpolateFunctions([1.5, 1.5, 1.5], false),
      [0.25, 0.25, 0.25, 0.25]
    ),
    'degenerate polygon'
  );

  t.end();
});

test('Test vtkPolygon intersectWithLine', (t) => {
  const polygon = vtkPolygon.newInstance();
  const poly = [
    [0, 0, 0],
    [3, 0, 0],
    [3, 3, 3],
    [0, 3, 3],
  ];
  polygon.setPoints(poly);

  let p0 = [1.5, 1.5, 0];
  let p1 = [1.5, 1.5, 5];
  let intersect = polygon.intersectWithLine(p0, p1);
  vtkMath.roundVector(intersect.x, intersect.x, 6);
  t.ok(
    intersect.intersection &&
      intersect.betweenPoints &&
      intersect.t - 0.3 <= EPSILON &&
      vtkMath.areEquals(intersect.x, [1.5, 1.5, 1.5]),
    'Point in polygon'
  );

  p0 = [3, 1.5, 0];
  p1 = [3, 1.5, 3];
  intersect = polygon.intersectWithLine(p0, p1);
  t.ok(
    intersect.intersection &&
      intersect.betweenPoints &&
      vtkMath.areEquals(intersect.x, [3, 1.5, 1.5]),
    'Point on edge of polygon'
  );

  p0 = [10, 1, 1];
  p1 = [10, 6, 6];
  intersect = polygon.intersectWithLine(p0, p1);
  t.ok(
    !intersect.intersection &&
      !intersect.betweenPoints &&
      intersect.t >= Number.MAX_VALUE &&
      intersect.x.length === 0,
    'Line parallele to polygon'
  );

  p0 = [5, 5, 0];
  p1 = [5, 5, 5];
  intersect = polygon.intersectWithLine(p0, p1);
  vtkMath.roundVector(intersect.x, intersect.x, 6);
  console.log(intersect);
  t.ok(
    !intersect.intersection &&
      intersect.betweenPoints &&
      intersect.t - 1 < EPSILON &&
      vtkMath.areEquals(intersect.x, [5, 5, 5]),
    'Intersect plane but not polygon'
  );

  t.end();
});

test('Test vtkPolygon intersectConvex2DCells', (t) => {
  const polygon = vtkPolygon.newInstance();
  const poly = [
    [0, 0, 0],
    [3, 0, 0],
    [3, 3, 3],
    [0, 3, 3],
  ];
  polygon.setPoints(poly);

  const polygonToIntersect = vtkPolygon.newInstance();
  let polyToIntersect = [
    [0, 1.5, 0],
    [3, 1.5, 0],
    [3, 1.5, 1.5],
    [0, 1.5, 3],
  ];
  polygonToIntersect.setPoints(polyToIntersect);

  let intersection = polygon.intersectConvex2DCells(polygonToIntersect);
  t.ok(
    intersection.intersection ===
      PolygonWithCellIntersectionState.LINE_INTERSECTION &&
      ((vtkMath.areEquals(intersection.x0, [0, 1.5, 1.5]) &&
        vtkMath.areEquals(intersection.x1, [3, 1.5, 1.5])) ||
        (vtkMath.areEquals(intersection.x0, [3, 1.5, 1.5]) &&
          vtkMath.areEquals(intersection.x1, [0, 1.5, 1.5]))),
    'line intersection'
  );

  polyToIntersect = [
    [0, 1.5, 1.5],
    [3, 1.5, 1.5],
    [3, 1.5, 1.5],
    [0, 1.5, 3],
  ];
  polygonToIntersect.setPoints(polyToIntersect);

  intersection = polygon.intersectConvex2DCells(polygonToIntersect);
  console.log(intersection);
  t.ok(
    intersection.intersection ===
      PolygonWithCellIntersectionState.LINE_INTERSECTION &&
      ((vtkMath.areEquals(intersection.x0, [0, 1.5, 1.5]) &&
        vtkMath.areEquals(intersection.x1, [3, 1.5, 1.5])) ||
        (vtkMath.areEquals(intersection.x0, [3, 1.5, 1.5]) &&
          vtkMath.areEquals(intersection.x1, [0, 1.5, 1.5]))),
    'line intersection on edge of one polygon'
  );

  polyToIntersect = [
    [1, 1.5, 1.5],
    [3, 1.5, 3],
    [0, 1.5, 3],
  ];
  polygonToIntersect.setPoints(polyToIntersect);

  intersection = polygon.intersectConvex2DCells(polygonToIntersect);
  t.ok(
    intersection.intersection ===
      PolygonWithCellIntersectionState.POINT_INTERSECTION &&
      vtkMath.areEquals(intersection.x0, [1, 1.5, 1.5]) &&
      vtkMath.areEquals(intersection.x1, []),
    'point intersection'
  );

  polyToIntersect = [
    [7, 7, 7],
    [4, 4, 4],
    [10, 10, 10],
  ];
  polygonToIntersect.setPoints(polyToIntersect);

  intersection = polygon.intersectConvex2DCells(polygonToIntersect);
  t.ok(
    intersection.intersection ===
      PolygonWithCellIntersectionState.NO_INTERSECTION &&
      vtkMath.areEquals(intersection.x0, []) &&
      vtkMath.areEquals(intersection.x1, []),
    'no intersection'
  );

  polyToIntersect = [
    [1, 1, 1],
    [2, 1, 1],
    [2, 2, 2],
    [1, 2, 2],
  ];
  polygonToIntersect.setPoints(polyToIntersect);
  intersection = polygon.intersectConvex2DCells(polygonToIntersect);
  t.ok(
    intersection.intersection === PolygonWithCellIntersectionState.INCLUDED &&
      vtkMath.areEquals(intersection.x0, []) &&
      vtkMath.areEquals(intersection.x1, []),
    'coincident polygons'
  );

  polyToIntersect = [
    [2, 1, 1],
    [4, 1, 1],
    [4, 2, 2],
    [2, 2, 2],
  ];
  polygonToIntersect.setPoints(polyToIntersect);
  intersection = polygon.intersectConvex2DCells(polygonToIntersect);
  t.ok(
    intersection.intersection === PolygonWithCellIntersectionState.OVERLAP &&
      vtkMath.areEquals(intersection.x0, []) &&
      vtkMath.areEquals(intersection.x1, []),
    'overlaping polygons'
  );
  t.end();
});
