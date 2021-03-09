import test from 'tape-catch';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

test('Test angleBetweenVector', (t) => {
  const a = [0, 0, 1];
  const b = [0, 1, 0];
  const c = [0, 10, 0];
  const d = [0, 0, -1];
  t.equal(vtkMath.angleBetweenVectors(a, b), vtkMath.radiansFromDegrees(90));
  t.equal(vtkMath.angleBetweenVectors(b, a), vtkMath.radiansFromDegrees(90));
  t.equal(vtkMath.angleBetweenVectors(a, b), vtkMath.angleBetweenVectors(a, c));
  t.equal(vtkMath.angleBetweenVectors(a, a), 0);
  t.equal(vtkMath.angleBetweenVectors(b, c), 0);
  t.equal(vtkMath.angleBetweenVectors(a, d), vtkMath.radiansFromDegrees(180));
  t.end();
});

test('Test signedAngleBetweenVector', (t) => {
  const n = [0, 0, 1];
  const a = [1, 0, 0];
  const b = [0, 1, 0];
  const c = [0, 10, 0];
  const d = [-1, 0, 0];
  t.equal(
    vtkMath.signedAngleBetweenVectors(a, b, n),
    vtkMath.radiansFromDegrees(90)
  );
  t.equal(
    vtkMath.signedAngleBetweenVectors(b, a, n),
    vtkMath.radiansFromDegrees(-90)
  );
  t.equal(
    vtkMath.signedAngleBetweenVectors(a, b, n),
    vtkMath.signedAngleBetweenVectors(a, c, n)
  );
  t.equal(vtkMath.signedAngleBetweenVectors(a, a, n), 0);
  t.equal(vtkMath.signedAngleBetweenVectors(b, c, n), 0);
  t.equal(
    vtkMath.signedAngleBetweenVectors(a, d, n),
    vtkMath.radiansFromDegrees(180)
  );
  t.equal(
    vtkMath.signedAngleBetweenVectors(d, a, n),
    vtkMath.radiansFromDegrees(180)
  );
  t.end();
});

test('Test roundNumber', (t) => {
  t.equal(vtkMath.roundNumber(1), 1, 'vtkMath.roundNumber(1)');
  t.equal(vtkMath.roundNumber(1, 1), 1, 'vtkMath.roundNumber(1, 1)');
  t.equal(vtkMath.roundNumber(1.4), 1, 'vtkMath.roundNumber(1.4)');
  t.equal(vtkMath.roundNumber(1.4, 0), 1, 'vtkMath.roundNumber(1.4, 0)');
  t.equal(vtkMath.roundNumber(1.4, 1), 1.4, 'vtkMath.roundNumber(1.4, 1)');
  t.equal(vtkMath.roundNumber(1.4, 2), 1.4, 'vtkMath.roundNumber(1.4, 2)');
  t.equal(vtkMath.roundNumber(1.46, 0), 1, 'vtkMath.roundNumber(1.46, 0)');
  t.equal(vtkMath.roundNumber(1.46, 1), 1.5, 'vtkMath.roundNumber(1.46, 1)');
  t.equal(vtkMath.roundNumber(1.46, 2), 1.46, 'vtkMath.roundNumber(1.46, 2)');
  t.equal(
    vtkMath.roundNumber(123.46, 0),
    123,
    'vtkMath.roundNumber(123.46, 0)'
  );
  t.equal(
    vtkMath.roundNumber(123.46, 1),
    123.5,
    'vtkMath.roundNumber(123.46, 1)'
  );
  t.equal(
    vtkMath.roundNumber(123.46, 2),
    123.46,
    'vtkMath.roundNumber(123.46, 2)'
  );
  t.equal(
    vtkMath.roundNumber(6.06627640054528e-14, 6),
    0,
    'vtkMath.roundNumber(6.06627640054528e-14, 6)'
  );
  t.equal(
    vtkMath.roundNumber(-6.06627640054528e-14, 6),
    0,
    'vtkMath.roundNumber(-6.06627640054528e-14, 6)'
  );
  t.equal(
    vtkMath.roundNumber(1.23456e3, 2),
    1234.56,
    'vtkMath.roundNumber(1.23456e4, 2)'
  );
  t.end();
});

test('Test areEquals', (t) => {
  const a1 = [1];
  const a2 = [1, 0];
  const a3 = [1, 0, 0];
  const b3 = [1 + 1e-7, 0, 0];
  t.ok(vtkMath.areEquals(a1, a1), 'same vec1');
  t.ok(vtkMath.areEquals(a2, a2), 'same vec2');
  t.ok(vtkMath.areEquals(a3, a3), 'same vec2');
  t.notOk(vtkMath.areEquals(a1, a2), 'larger vec');
  t.notOk(vtkMath.areEquals(a3, a2), 'smaller vec');
  t.ok(vtkMath.areEquals(a3, a3, 0), 'exact comparison for same vec');
  t.notOk(vtkMath.areEquals(a3, b3, 0), 'exact(0) comparison for diff vec');
  t.notOk(
    vtkMath.areEquals(a3, b3, 1e-8),
    'approx(1e-8) comparison for diff vec'
  );
  t.ok(
    vtkMath.areEquals(a3, b3, 2e-7),
    'approx (2e-7) comparison for diff vec'
  );
  t.ok(
    vtkMath.areEquals(a3, b3, 1e-6),
    'approx (1e-6) comparison for diff vec'
  );
  t.end();
});
