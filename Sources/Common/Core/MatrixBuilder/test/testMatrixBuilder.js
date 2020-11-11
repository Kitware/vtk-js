import test from 'tape-catch';

import { areEquals } from 'vtk.js/Sources/Common/Core/Math';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';

test('Test vtkMatrixBuilder rotateFromDirections', (t) => {
  let v1 = [];

  v1 = [1, 0, 0];
  vtkMatrixBuilder
    .buildFromRadian()
    .identity()
    .rotateFromDirections(v1, [-1, 0, 0])
    .apply(v1);
  t.ok(areEquals(v1, [-1, 0, 0]));

  v1 = [1, 0, 0];
  vtkMatrixBuilder
    .buildFromRadian()
    .identity()
    .rotateFromDirections(v1, [1, 0, 0])
    .apply(v1);
  t.ok(areEquals(v1, [1, 0, 0]));

  v1 = [Math.PI / 2, 0, Math.PI / 2];
  vtkMatrixBuilder
    .buildFromRadian()
    .identity()
    .rotateFromDirections(
      [Math.PI / 2, Math.PI / 2, 0],
      [Math.PI / 2, 0, Math.PI / 2]
    )
    .apply(v1);
  t.ok(areEquals(v1, [0, -Math.PI / 2, Math.PI / 2]));

  t.end();
});
