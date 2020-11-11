import test from 'tape-catch';

import { areEquals } from 'vtk.js/Sources/Common/Core/Math';
import { boundPlane } from 'vtk.js/Sources/Widgets/Widgets3D/ResliceCursorWidget/helpers';

test('Test boundPlane natural basis simple', (t) => {
  const origin = [-1, -1, 0];
  const point1 = [2, -1, 0];
  const point2 = [-1, 2, 0];

  const bounds = [0, 1, 0, 1, 0, 1];

  boundPlane(bounds, origin, point1, point2);

  t.ok(areEquals(origin, [0, 0, 0]));
  t.ok(areEquals(point1, [1, 0, 0]));
  t.ok(areEquals(point2, [0, 1, 0]));

  t.end();
});

test('Test boundPlane natural basis with offset', (t) => {
  const origin = [-1, -1, -1.5];
  const point1 = [2, -1, -1.5];
  const point2 = [-1, 2, -1.5];

  const bounds = [0, 1, 1, 2, -2, -1];

  boundPlane(bounds, origin, point1, point2);

  t.ok(areEquals(origin, [0, 1, -1.5]));
  t.ok(areEquals(point1, [1, 1, -1.5]));
  t.ok(areEquals(point2, [0, 2, -1.5]));

  t.end();
});

test('Test boundPlane oriented', (t) => {
  const origin = [0, 0, 0];
  const point1 = [1, 1, 0];
  const point2 = [0, 0, 1];

  const bounds = [0, 1, 0, 1, 0, 1];

  boundPlane(bounds, origin, point1, point2);

  t.ok(areEquals(origin, [0, 0, 0]));
  t.ok(areEquals(point1, [1, 1, 0]));
  t.ok(areEquals(point2, [0, 0, 1]));

  t.end();
});

test('Test boundPlane no intersection', (t) => {
  const origin = [0, 0, 0];
  const point1 = [2, 0, 0];
  const point2 = [0, 2, 0];

  const bounds = [0, 1, 0, 1, 1, 2];

  boundPlane(bounds, origin, point1, point2);

  t.ok(areEquals(origin, [0, 0, 0]));
  t.ok(areEquals(point1, [2, 0, 0]));
  t.ok(areEquals(point2, [0, 2, 0]));

  t.end();
});
