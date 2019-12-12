import test from 'tape-catch';

import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';

const EPSILON = 1e-6;

function vec3Equals(a, b, eps = EPSILON) {
  if (a.length !== 3 || b.length !== 3) {
    return false;
  }
  return (
    Math.abs(a[0] - b[0]) < eps &&
    Math.abs(a[1] - b[1]) < eps &&
    Math.abs(a[2] - b[2]) < eps
  );
}

test('Test vtkMatrixBuilder rotateFromDirections', (t) => {
  let v1 = [];

  v1 = [1, 0, 0];
  vtkMatrixBuilder
    .buildFromRadian()
    .identity()
    .rotateFromDirections(v1, [-1, 0, 0])
    .apply(v1);
  t.ok(vec3Equals(v1, [-1, 0, 0]));

  v1 = [1, 0, 0];
  vtkMatrixBuilder
    .buildFromRadian()
    .identity()
    .rotateFromDirections(v1, [1, 0, 0])
    .apply(v1);
  t.ok(vec3Equals(v1, [1, 0, 0]));

  v1 = [Math.PI / 2, 0, Math.PI / 2];
  vtkMatrixBuilder
    .buildFromRadian()
    .identity()
    .rotateFromDirections(
      [Math.PI / 2, Math.PI / 2, 0],
      [Math.PI / 2, 0, Math.PI / 2]
    )
    .apply(v1);
  t.ok(vec3Equals(v1, [0, -Math.PI / 2, Math.PI / 2]));

  t.end();
});
