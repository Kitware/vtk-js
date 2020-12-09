import test from 'tape-catch';

import {
  rotateVector,
  radiansFromDegrees,
  areEquals,
} from 'vtk.js/Sources/Common/Core/Math';

test('Test vtkMath rotateVector', (t) => {
  function degreesToRadians(degrees) {
    return radiansFromDegrees(degrees);
  }

  const XAxis = [1, 0, 0];
  const YAxis = [0, 1, 0];
  const ZAxis = [0, 0, 1];

  const XAxis90Z = rotateVector(XAxis, ZAxis, degreesToRadians(90));
  t.ok(areEquals(XAxis90Z, [0, 1, 0]));

  const XAxis180Z = rotateVector(XAxis, ZAxis, degreesToRadians(180));
  t.ok(areEquals(XAxis180Z, [-1, 0, 0]));

  const XAxis90Y = rotateVector(XAxis, YAxis, degreesToRadians(90));
  t.ok(areEquals(XAxis90Y, [0, 0, -1]));

  const XAxis180Y = rotateVector(XAxis, YAxis, degreesToRadians(180));
  t.ok(areEquals(XAxis180Y, [-1, 0, 0]));

  t.end();
});
