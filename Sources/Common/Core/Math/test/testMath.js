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

test('Test outer2D', (t) => {
  const zeroVect = [0, 0];
  const x = [1, 2];
  const y = [2, 3];
  const zeroMatrix = [0, 0, 0, 0];
  const res = [0, 0, 0, 0];
  vtkMath.outer2D(zeroVect, zeroMatrix, res);
  t.ok(
    vtkMath.areEquals(res, zeroMatrix),
    `Expected zero matrix, result : [${res}]`
  );
  vtkMath.outer2D(x, y, res);
  t.ok(
    vtkMath.areEquals(res, [2, 3, 4, 6]),
    `Expected [2, 3, 4, 6], result : [${res}]`
  );
  t.end();
});

test('Test outer', (t) => {
  const zeroVect = [0, 0, 0];
  const x = [1, 2, 3];
  const y = [2, 2, 3];
  const zeroMatrix = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const res = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  vtkMath.outer(zeroVect, zeroMatrix, res);
  t.ok(
    vtkMath.areEquals(res, zeroMatrix),
    `Expected zero matrix, result : [${res}]`
  );
  vtkMath.outer(x, y, res);
  t.ok(
    vtkMath.areEquals(res, [2, 2, 3, 4, 4, 6, 6, 6, 9]),
    `Expected [2, 2, 3, 4, 4, 6, 6, 6, 9], result : [${res}]`
  );
  t.end();
});

test('Test Identity3x3', (t) => {
  const m = [0, 2, 1, 2, 4, 0, 4, 0, 7];
  vtkMath.identity3x3(m);
  t.ok(vtkMath.areEquals(m, [1, 0, 0, 0, 1, 0, 0, 0, 1]));
  t.end();
});

test('Test Identity', (t) => {
  // prettier-ignore
  const m = [
    0, 4, 0, 0,
    2, 2, 1, 0,
    0, 0, 9, 0,
    0, 3, 7, 0]
  // prettier-ignore
  const Id = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ]
  const returnedMatrix = vtkMath.identity(4, m);
  t.ok(vtkMath.areEquals(m, Id));
  t.ok(vtkMath.areEquals(returnedMatrix, Id));
  const voidMatrix = [];
  t.ok(vtkMath.areEquals(vtkMath.identity(4, voidMatrix), Id));

  t.end();
});

test('Test transpose3x3', (t) => {
  const m = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const id = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const m1 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  vtkMath.transpose3x3(id, m);
  t.ok(vtkMath.areEquals(m, id), 'identity');
  vtkMath.transpose3x3(m1, m);
  t.ok(vtkMath.areEquals(m, [1, 4, 7, 2, 5, 8, 3, 6, 9]), 'general case');
  t.end();
});

test('Test Multiply Matrix', (t) => {
  const nullMatrix = [0, 0, 0, 0];
  const m2x2 = [1, 1, 2, 4];
  const m1 = [1, 1];
  const m2 = [2, 3, 3, 1, 1, 2, 1, 2];
  const m3 = [2, -3, 3, 1, -1, 2, -1, -1];
  const resMat = [0, 0, 0];

  vtkMath.multiplyMatrix(m2x2, nullMatrix, 2, 2, 2, 2, resMat);
  t.ok(vtkMath.areEquals(resMat, nullMatrix), 'multiplication by zero matrix');

  vtkMath.multiplyMatrix(m1, m2, 1, 2, 2, 4, resMat);
  t.ok(
    vtkMath.areEquals(resMat, [3, 5, 4, 3]),
    'multiplication by one row matrix'
  );

  vtkMath.multiplyMatrix(m2x2, m2, 2, 2, 2, 4, resMat);
  t.ok(
    vtkMath.areEquals(resMat, [3, 5, 4, 3, 8, 14, 10, 10]),
    'multiplication of two matrices of compatible sizes'
  );

  vtkMath.multiplyMatrix(m2x2, m3, 2, 2, 2, 4, resMat);
  t.ok(
    vtkMath.areEquals(resMat, [1, -1, 2, 0, 0, 2, 2, -2]),
    'multiplication of two matrices of compatible sizes, negative values'
  );

  t.notOk(
    vtkMath.multiplyMatrix(m2, m2x2, 2, 4, 2, 2, resMat),
    'multiplication of two matrices of incompatible sizes'
  );
  t.end();
});
test('Test multiplyMatrix3x3', (t) => {
  const nullMatrix = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const m1 = [1, 2, 1, 2, 3, 1, 2, 1, 3];
  const m2 = [2, 3, 3, 1, 1, 2, 1, 2, 1];
  const m3 = [2, -3, 3, 1, -1, 2, -1, 2, -1];
  const resMat = [0, 0, 0, 0, 0, 0, 0, 0, 0];

  vtkMath.multiply3x3_mat3(m1, nullMatrix, resMat);
  t.ok(vtkMath.areEquals(resMat, nullMatrix), 'multiplication by zero matrix');

  vtkMath.multiply3x3_mat3(m1, m2, resMat);
  t.ok(
    vtkMath.areEquals(resMat, [5, 7, 8, 8, 11, 13, 8, 13, 11]),
    'multiplication of two matrices'
  );

  vtkMath.multiply3x3_mat3(m1, m3, resMat);
  t.ok(
    vtkMath.areEquals(resMat, [3, -3, 6, 6, -7, 11, 2, -1, 5]),
    'multiplication of two matrices with negative values'
  );

  t.end();
});

test('Test multiply 3x3 matrix with vect3', (t) => {
  const zeroVector = [0, 0, 0];
  const m1 = [1, 2, 1, 3, 2, 1, 1, 3, 2];
  const m2 = [1, -2, 1, 3, -2, 1, -1, -3, 2];
  const v1 = [2, 2, 3];
  const resMat = [0, 0, 0];

  vtkMath.multiply3x3_vect3(m1, zeroVector, resMat);
  t.ok(vtkMath.areEquals(resMat, zeroVector), 'multiplication by zero vector');

  vtkMath.multiply3x3_vect3(m1, v1, resMat);
  t.ok(
    vtkMath.areEquals(resMat, [9, 13, 14]),
    'multiplication of matrix and vector of positive values'
  );

  vtkMath.multiply3x3_vect3(m2, v1, resMat);
  t.ok(
    vtkMath.areEquals(resMat, [1, 5, -2]),
    'multiplication of matrix and vector of negative values'
  );
  t.end();
});

test('Test determinant 2x2', (t) => {
  const p1 = [2, 3];
  const p2 = [1, 2];
  t.ok(
    vtkMath.determinant2x2(0, 0, 0, 0) === 0,
    'determinant zero matrix with 4 args '
  );
  t.ok(
    vtkMath.determinant2x2(2, 3, 1, 2) === 1,
    'determinant general case with 4 args '
  );
  t.ok(
    vtkMath.determinant2x2(p1, p2) === 1,
    'determinant general case with 2 points '
  );
  t.end();
});

test('Test determinant 3x3', (t) => {
  const m0 = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const m1 = [1, 2, 1, 2, 3, 1, 2, 2, 3];
  const d = [1, 0, 0, 0, 2, 0, 0, 0, 3];
  t.ok(vtkMath.determinant3x3(m0) === 0, 'determinant (zero matrix) ');
  t.ok(vtkMath.determinant3x3(m1) === -3, 'determinant (general case) ');
  t.ok(vtkMath.determinant3x3(d) === 6, 'determinant (diagonal matrix) ');
  t.end();
});

test('Test invert3x3', (t) => {
  const m1 = [1, 2, 1, 2, 3, 1, 2, 2, 3];
  const mInverse = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const d = [1, 0, 0, 0, 2, 0, 0, 0, 3];
  vtkMath.invert3x3(d, mInverse);
  t.ok(
    vtkMath.areEquals(mInverse, [1, 0, 0, 0, 0.5, 0, 0, 0, 1 / 3]),
    'invert (diagonal matrix)'
  );
  vtkMath.invert3x3(m1, mInverse);
  t.ok(
    vtkMath.areEquals(
      mInverse,
      [
        -2.333333, 1.333333, 0.333333, 1.333333, -0.333333, -0.333333, 0.666667,
        -0.666667, 0.333333,
      ]
    ),
    'invert (general case) '
  );
  t.end();
});

test('Test invertMatrix', (t) => {
  const m1 = [1, 2, 1, 1, 2, 3, 1, 1, 2, 2, 3, 1, 2, 3, 1, 2];
  let mInverse = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const d = [1, 0, 0, 0, 2, 0, 0, 0, 3];
  vtkMath.invertMatrix(d, mInverse, 3);
  t.ok(
    vtkMath.areEquals(mInverse, [1, 0, 0, 0, 0.5, 0, 0, 0, 1 / 3]),
    'invert (diagonal matrix)'
  );
  mInverse = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  vtkMath.invertMatrix(m1, mInverse, 4);
  t.ok(
    vtkMath.areEquals(
      mInverse,
      [
        -2.333333, 0.666667, 0.333333, 0.666666, 1.333333, 0.333333, -0.333333,
        -0.666667, 0.666667, -0.333333, 0.333333, -0.333333, 0, -1, 0, 1,
      ]
    ),
    'invert (general case)'
  );
  t.end();
});

test('Test JacobiN', (t) => {
  for (
    let dimension = 2;
    dimension < 30;
    dimension += vtkMath.roundNumber(10 * Math.random(), 0)
  ) {
    const mat = vtkMath.createArray(dimension * dimension);
    const orig = vtkMath.createArray(dimension * dimension);
    const eigenVector = vtkMath.createArray(dimension * dimension);
    const eigenVectorT = vtkMath.createArray(dimension * dimension);
    const temp = vtkMath.createArray(dimension * dimension);
    const result = vtkMath.createArray(dimension * dimension);
    const eigen = vtkMath.createArray(dimension);

    for (let n = 0; n < 100; n++) {
      for (let i = 0; i < dimension; ++i) {
        for (let j = i; j < dimension; ++j) {
          mat[i * dimension + j] = Math.random();
          mat[j * dimension + i] = mat[i * dimension + j];
          orig[i * dimension + j] = mat[i * dimension + j];
          orig[j * dimension + i] = mat[i * dimension + j];
        }
      }

      vtkMath.jacobiN(mat, dimension, eigen, eigenVector);

      vtkMath.multiplyMatrix(
        orig,
        eigenVector,
        dimension,
        dimension,
        dimension,
        dimension,
        temp
      );
      vtkMath.invertMatrix(eigenVector, eigenVectorT, dimension);
      vtkMath.multiplyMatrix(
        eigenVectorT,
        temp,
        dimension,
        dimension,
        dimension,
        dimension,
        result
      );
      const expected = vtkMath.createArray(dimension * dimension);
      for (let i = 0; i < dimension; i++) {
        expected[i * dimension + i] = eigen[i];
      }
      t.ok(vtkMath.areEquals(result, expected));
    }
  }
  t.end();
});

test('Test diagonalize', (t) => {
  const mat = [];
  const original = [];
  let eigenVector = [];
  const eigenVectorT = [];
  const temp = [];
  const result = [];
  let eigen = [];

  for (let n = 0; n < 100; n++) {
    for (let i = 0; i < 3; i++) {
      for (let j = i; j < 3; j++) {
        mat[i * 3 + j] = Math.random(-1.0, 1.0);
        mat[j * 3 + i] = mat[i * 3 + j];
        original[i * 3 + j] = mat[i * 3 + j];
        original[j * 3 + i] = mat[j * 3 + i];
      }
    }

    vtkMath.jacobiN(mat, 3, eigen, eigenVector);
    vtkMath.diagonalize3x3(original, eigen, eigenVector);

    // Pt * A * P = diagonal matrix with eigenvalues on diagonal
    vtkMath.multiply3x3_mat3(original, eigenVector, temp);
    vtkMath.invert3x3(eigenVector, eigenVectorT);
    vtkMath.multiply3x3_mat3(eigenVectorT, temp, result);
    for (let i = 0; i < 9; i++) {
      result[i] = vtkMath.roundNumber(result[i], 6);
    }
    const expected = vtkMath.createArray(9);
    expected[0] = vtkMath.roundNumber(eigen[0], 6);
    expected[4] = vtkMath.roundNumber(eigen[1], 6);
    expected[8] = vtkMath.roundNumber(eigen[2], 6);
    t.ok(
      vtkMath.areEquals(result, expected),
      `Expected : ${expected} ; Result : ${result}`
    );
  }
  // Now test for 2 and 3 equal eigenvalues
  vtkMath.identity3x3(mat);
  mat[0] = 5.0;
  mat[4] = 5.0;
  mat[8] = 1.0;

  eigenVector = vtkMath.createArray(9);
  eigen = vtkMath.createArray(3);
  vtkMath.diagonalize3x3(mat, eigen, eigenVector);
  t.ok(
    vtkMath.areEquals(mat, [5, 0, 0, 0, 5, 0, 0, 0, 1]),
    `Mat : ${mat} ; Eigen : ${eigen}`
  );

  vtkMath.identity3x3(mat);
  mat[0] = 2.0;
  mat[4] = 2.0;
  mat[8] = 2.0;

  eigenVector = vtkMath.createArray(9);
  eigen = vtkMath.createArray(3);
  vtkMath.diagonalize3x3(mat, eigen, eigenVector);
  t.ok(
    vtkMath.areEquals(eigenVector, [1, 0, 0, 0, 1, 0, 0, 0, 1]),
    `P : ${eigenVector} ; Eigen : ${eigen}`
  );

  t.end();
});

test('Test Orthogonalize3x3', (t) => {
  const mat = [];
  const mat0 = [];
  const matI = [];
  for (let n = 0; n < 100; n++) {
    for (let i = 0; i < 9; i++) {
      mat[i] = Math.random();
    }
    vtkMath.orthogonalize3x3(mat, mat0);
    vtkMath.transpose3x3(mat0, mat);
    vtkMath.multiply3x3_mat3(mat, mat0, matI);

    const identity = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    t.ok(vtkMath.areEquals(matI, identity));
  }
  t.end();
});

test('Test matrix3x3ToQuaternion', (t) => {
  const m0 = [-1, 0, 0, 0, -1, 0, 0, 0, 1];
  const m1 = [1, 1, 0, 1, -1, 0, 0, 0, 1];
  const quat4 = [0, 0, 0, 0];
  vtkMath.matrix3x3ToQuaternion(m0, quat4);
  t.ok(
    vtkMath.areEquals(quat4, [0, 0, 0, 1]),
    'Test for integer values for quaternion.'
  );
  vtkMath.matrix3x3ToQuaternion(m1, quat4);
  t.ok(
    vtkMath.areEquals(quat4, [0.0, 0.92388, 0.382683, 0.0]),
    'Test for non integer values for quaternion coordinates.'
  );
  t.end();
});

test('Test quaternionToMatrix3x3', (t) => {
  const matRes = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const quat1 = [0, 0, 0, 1];
  const quat2 = [0.0, 0.5, 0.5, 0.5];
  vtkMath.quaternionToMatrix3x3(quat1, matRes);
  t.ok(
    vtkMath.areEquals(matRes, [-1, 0, 0, 0, -1, 0, 0, 0, 1]),
    'Test for integer values of quat'
  );
  vtkMath.quaternionToMatrix3x3(quat2, matRes);
  t.ok(
    vtkMath.areEquals(
      matRes,
      [
        -0.333333, 0.666667, 0.666667, 0.666667, -0.333333, 0.666667, 0.666667,
        0.666667, -0.333333,
      ]
    ),
    'Test for non integer values of quat'
  );
  t.end();
});

test('Test multiplyQuaternion', (t) => {
  const quat1 = [0, 0, 0, 1];
  const quat2 = [0, 0.5, 0.5, 0.5];
  const quatRes = [0, 0, 0, 0];
  vtkMath.multiplyQuaternion(quat1, quat2, quatRes);
  t.ok(
    vtkMath.areEquals(quatRes, [-0.5, -0.5, 0.5, 0.0]),
    'Test multiply two quaternions'
  );
  t.end();
});

test('Test EstimateMatrixCondition', (t) => {
  let res = vtkMath.estimateMatrixCondition([0, 0, 0, 0], 2);
  t.ok(
    res === Number.MAX_VALUE,
    `Expected ${Number.MAX_VALUE} returned ${res}`
  );
  res = vtkMath.estimateMatrixCondition([2, 2, 0, 2], 2);
  t.ok(res === 1, `Expected 1 returned ${res}`);
  res = vtkMath.estimateMatrixCondition([2, 4, 0, -2], 2);
  t.ok(res === 2, `Expected 2 returned ${res}`);
  t.end();
});

test('Test solveHomogeneousLeastSquares', (t) => {
  const m = vtkMath.createArray(2);
  const x = [1, 2, 3, 4, 5, 6];

  vtkMath.solveHomogeneousLeastSquares(3, x, 2, m);

  // As the method only finds the best fitting matrix m, we check whether m
  // corresponds to the smallest eigen values of XX' (X times X transpose)
  // as this is the result expected with the method used
  const XXt = [35, 44, 44, 56];
  const eigenvals = [];
  const eigenvecs = [];
  vtkMath.jacobiN(XXt, 2, eigenvals, eigenvecs);
  const expected = [eigenvecs[1], eigenvecs[3]];
  t.ok(
    vtkMath.areEquals(expected, m),
    'solve with order lower than number of samples'
  );
  t.ok(
    vtkMath.solveHomogeneousLeastSquares(3, x, 4, m) === 0,
    'solve with order upper than number of samples (underdetermined system)'
  );
  t.end();
});

test('Test solveLeastSquares', (t) => {
  const m = [];
  const x = [];
  const y = [];

  x[0] = 1;
  x[1] = 4;
  x[2] = 1;
  x[3] = 2;
  x[4] = 2;
  x[5] = 3;

  y[0] = -2;
  y[1] = 6;
  y[2] = 1;

  vtkMath.solveLeastSquares(3, x, 2, y, 1, m);

  let expecteds = [3.0, -1.0];

  t.ok(vtkMath.areEquals(expecteds, m));

  // Now make one solution homogenous
  y[0] = -5.0;
  y[1] = -1.0;
  y[2] = 0.0;
  vtkMath.solveLeastSquares(3, x, 2, y, 1, m);
  expecteds = [3.0, -2.0];
  t.ok(vtkMath.areEquals(expecteds, m), 'One solution homogenous');

  // Now make all homogenous
  y[0] = 0.0;
  y[1] = 0.0;
  y[2] = 0.0;
  vtkMath.solveLeastSquares(3, x, 2, y, 1, m);
  const mHomogenous = vtkMath.createArray(2);
  vtkMath.solveHomogeneousLeastSquares(3, x, 2, mHomogenous);
  t.ok(vtkMath.areEquals(m, mHomogenous), 'All homogenous');

  // Insufficient number of samples. Underdetermined.
  t.notOk(
    vtkMath.solveLeastSquares(1, x, 2, y, 1, m) !== 0,
    'Underdetermined system'
  );
  t.end();
});

test('Test solveLinearSystem', (t) => {
  for (let NDimension = 1; NDimension < 30; NDimension += 5) {
    for (let n = 0; n < 50; n++) {
      // Generate a Random Matrix
      const mat = [];
      const lhs = [];
      const rhs = [];

      for (let i = 0; i < NDimension; i++) {
        lhs[i] = Math.random(-1.0, 1.0);
        for (let j = 0; j < NDimension; j++) {
          mat[i * NDimension + j] = vtkMath.random(-1.0, 1.0);
        }
      }

      for (let i = 0; i < NDimension; i++) {
        rhs[i] = 0.0;
        for (let j = 0; j < NDimension; j++) {
          rhs[i] += mat[i * NDimension + j] * lhs[j];
        }
      }
      vtkMath.solveLinearSystem(mat, rhs, NDimension);

      t.ok(vtkMath.areEquals(lhs, rhs));

      if (NDimension === 1 || NDimension === 2) {
        for (let i = 0; i < NDimension; i++) {
          for (let j = 0; j < NDimension; j++) {
            mat[i * NDimension + j] = 0.0;
          }
        }
        t.ok(
          vtkMath.solveLinearSystem(mat, rhs, NDimension) === 0.0,
          'Should give zero matrix when dim = 1 or 2'
        );
      }
    }
  }
  t.end();
});

test('Test linearSolve3x3', (t) => {
  // Generate a Hilbert Matrix
  const mat = [];
  const lhs = [];
  const rhs = [];
  const solution = [];

  for (let n = 0; n < 20; n++) {
    for (let i = 0; i < 3; i++) {
      lhs[i] = vtkMath.random(-1.0, 1.0);
    }

    for (let i = 1; i <= 3; i++) {
      rhs[i - 1] = 0.0;
      for (let j = 1; j <= 3; j++) {
        mat[(i - 1) * 3 + j - 1] = 1.0 / (i + j - 1);
        rhs[i - 1] += mat[(i - 1) * 3 + j - 1] * lhs[j - 1];
      }
    }
    vtkMath.linearSolve3x3(mat, rhs, solution);
    t.ok(vtkMath.areEquals(lhs, solution));
  }
  t.end();
});

test('Test luSolve3x3 and luFactor', (t) => {
  // Generate a Hilbert Matrix
  const mat = [];
  const index = [];
  const lhs = [];
  const rhs = [];

  for (let n = 0; n < 100; n++) {
    for (let i = 0; i < 3; i++) {
      lhs[i] = Math.random(-1.0, 1.0);
    }

    for (let i = 1; i <= 3; i++) {
      rhs[i - 1] = 0.0;
      for (let j = 1; j <= 3; j++) {
        mat[(i - 1) * 3 + j - 1] = 1.0 / (i + j - 1);
        rhs[i - 1] += mat[(i - 1) * 3 + j - 1] * lhs[j - 1];
      }
    }
    vtkMath.LUFactor3x3(mat, index);
    vtkMath.LUSolve3x3(mat, index, rhs);
    t.ok(vtkMath.areEquals(lhs, rhs));
  }
  t.end();
});

test('Test singularValueDecomposition', (t) => {
  const a = [];
  const orig = [];
  const u = [];
  const w = [];
  const vt = [];

  for (let n = 0; n < 100; n++) {
    for (let i = 0; i < 9; i++) {
      orig[i] = Math.random(-10.0, 10.0);
      a[i] = orig[i];
    }
    vtkMath.singularValueDecomposition3x3(a, u, w, vt);

    const m = [];
    const W = [];
    vtkMath.identity3x3(W);
    W[0] = w[0];
    W[4] = w[1];
    W[8] = w[2];
    vtkMath.multiply3x3_mat3(u, W, m);
    vtkMath.multiply3x3_mat3(m, vt, m);
    let msg = 'A = U * W * VT';
    if (!vtkMath.areEquals(m, orig)) {
      msg = `A = U * W * VT : A = [${orig}] // got U = [${u}] ; VT = ${vt}`;
    }
    t.ok(vtkMath.areEquals(m, orig), msg);
  }
  t.end();
});
