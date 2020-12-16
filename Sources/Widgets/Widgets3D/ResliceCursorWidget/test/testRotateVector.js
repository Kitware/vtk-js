import test from 'tape-catch';

import { radiansFromDegrees, areEquals } from 'vtk.js/Sources/Common/Core/Math';

import { rotateVector } from 'vtk.js/Sources/Widgets/Widgets3D/ResliceCursorWidget/helpers';

test('Test vtkResliceCursorHelper rotateVector', (t) => {
  const XAxis = [1, 0, 0];
  const YAxis = [0, 1, 0];
  const ZAxis = [0, 0, 1];

  const XAxis90Z = rotateVector(XAxis, ZAxis, radiansFromDegrees(90));
  t.ok(areEquals(XAxis90Z, [0, 1, 0]));

  const XAxis180Z = rotateVector(XAxis, ZAxis, radiansFromDegrees(180));
  t.ok(areEquals(XAxis180Z, [-1, 0, 0]));

  const XAxis90Y = rotateVector(XAxis, YAxis, radiansFromDegrees(90));
  t.ok(areEquals(XAxis90Y, [0, 0, -1]));

  const XAxis180Y = rotateVector(XAxis, YAxis, radiansFromDegrees(180));
  t.ok(areEquals(XAxis180Y, [-1, 0, 0]));

  t.end();
});
