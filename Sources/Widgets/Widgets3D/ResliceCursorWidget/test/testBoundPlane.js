import { it, expect } from 'vitest';
import { areEquals } from 'vtk.js/Sources/Common/Core/Math';
import { boundPlane } from 'vtk.js/Sources/Widgets/Widgets3D/ResliceCursorWidget/helpers';

it('Test boundPlane natural basis simple', () => {
  const origin = [-1, -1, 0];
  const point1 = [2, -1, 0];
  const point2 = [-1, 2, 0];

  const bounds = [0, 1, 0, 1, 0, 1];

  boundPlane(bounds, origin, point1, point2);

  expect(areEquals(origin, [0, 0, 0])).toBeTruthy();
  expect(areEquals(point1, [1, 0, 0])).toBeTruthy();
  expect(areEquals(point2, [0, 1, 0])).toBeTruthy();
});

it('Test boundPlane natural basis with offset', () => {
  const origin = [-1, -1, -1.5];
  const point1 = [2, -1, -1.5];
  const point2 = [-1, 2, -1.5];

  const bounds = [0, 1, 1, 2, -2, -1];

  boundPlane(bounds, origin, point1, point2);

  expect(areEquals(origin, [0, 1, -1.5])).toBeTruthy();
  expect(areEquals(point1, [1, 1, -1.5])).toBeTruthy();
  expect(areEquals(point2, [0, 2, -1.5])).toBeTruthy();
});

it('Test boundPlane oriented', () => {
  const origin = [0, 0, 0];
  const point1 = [1, 1, 0];
  const point2 = [0, 0, 1];

  const bounds = [0, 1, 0, 1, 0, 1];

  boundPlane(bounds, origin, point1, point2);

  expect(areEquals(origin, [0, 0, 0])).toBeTruthy();
  expect(areEquals(point1, [1, 1, 0])).toBeTruthy();
  expect(areEquals(point2, [0, 0, 1])).toBeTruthy();
});

it('Test boundPlane no intersection', () => {
  const origin = [0, 0, 0];
  const point1 = [2, 0, 0];
  const point2 = [0, 2, 0];

  const bounds = [0, 1, 0, 1, 1, 2];

  expect(boundPlane(bounds, origin, point1, point2)).toBeFalsy();

  expect(areEquals(origin, [0, 0, 0])).toBeTruthy();
  expect(areEquals(point1, [2, 0, 0])).toBeTruthy();
  expect(areEquals(point2, [0, 2, 0])).toBeTruthy();
});

it('Test boundPlane with point closed to bounds limits', () => {
  const origin = [-146.45421827279782, -101.95882636683, -64.91712337082552];
  const p1 = [147.22047922902922, -101.95882636683, -64.91712337082552];
  const p2 = [-146.45421827279782, -101.95882636683, 194.58407789818668];

  const bounds = [
    -117.53152848, 137.57958263142996, -101.95882637, 52.04117363,
    -63.819600831429966, 191.29151028,
  ];

  expect(boundPlane(bounds, origin, p1, p2)).toBeTruthy();
});
