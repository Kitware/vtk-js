import { it, expect } from 'vitest';
import { radiansFromDegrees, areEquals } from 'vtk.js/Sources/Common/Core/Math';

import { rotateVector } from 'vtk.js/Sources/Widgets/Widgets3D/ResliceCursorWidget/helpers';

it('Test vtkResliceCursorHelper rotateVector', () => {
  const XAxis = [1, 0, 0];
  const YAxis = [0, 1, 0];
  const ZAxis = [0, 0, 1];

  const XAxis90Z = rotateVector(XAxis, ZAxis, radiansFromDegrees(90));
  expect(areEquals(XAxis90Z, [0, 1, 0])).toBeTruthy();

  const XAxis180Z = rotateVector(XAxis, ZAxis, radiansFromDegrees(180));
  expect(areEquals(XAxis180Z, [-1, 0, 0])).toBeTruthy();

  const XAxis90Y = rotateVector(XAxis, YAxis, radiansFromDegrees(90));
  expect(areEquals(XAxis90Y, [0, 0, -1])).toBeTruthy();

  const XAxis180Y = rotateVector(XAxis, YAxis, radiansFromDegrees(180));
  expect(areEquals(XAxis180Y, [-1, 0, 0])).toBeTruthy();
});
