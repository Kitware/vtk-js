import { it, expect } from 'vitest';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

it('Test angleBetweenVector', () => {
  const a = [0, 0, 1];
  const b = [0, 1, 0];
  const c = [0, 10, 0];
  const d = [0, 0, -1];
  expect(vtkMath.angleBetweenVectors(a, b)).toBe(
    vtkMath.radiansFromDegrees(90)
  );
  expect(vtkMath.angleBetweenVectors(b, a)).toBe(
    vtkMath.radiansFromDegrees(90)
  );
  expect(vtkMath.angleBetweenVectors(a, b)).toBe(
    vtkMath.angleBetweenVectors(a, c)
  );
  expect(vtkMath.angleBetweenVectors(a, a)).toBe(0);
  expect(vtkMath.angleBetweenVectors(b, c)).toBe(0);
  expect(vtkMath.angleBetweenVectors(a, d)).toBe(
    vtkMath.radiansFromDegrees(180)
  );
});

it('Test signedAngleBetweenVector', () => {
  const n = [0, 0, 1];
  const a = [1, 0, 0];
  const b = [0, 1, 0];
  const c = [0, 10, 0];
  const d = [-1, 0, 0];
  expect(vtkMath.signedAngleBetweenVectors(a, b, n)).toBe(
    vtkMath.radiansFromDegrees(90)
  );
  expect(vtkMath.signedAngleBetweenVectors(b, a, n)).toBe(
    vtkMath.radiansFromDegrees(-90)
  );
  expect(vtkMath.signedAngleBetweenVectors(a, b, n)).toBe(
    vtkMath.signedAngleBetweenVectors(a, c, n)
  );
  expect(vtkMath.signedAngleBetweenVectors(a, a, n)).toBe(0);
  expect(vtkMath.signedAngleBetweenVectors(b, c, n)).toBe(0);
  expect(vtkMath.signedAngleBetweenVectors(a, d, n)).toBe(
    vtkMath.radiansFromDegrees(180)
  );
  expect(vtkMath.signedAngleBetweenVectors(d, a, n)).toBe(
    vtkMath.radiansFromDegrees(180)
  );
});

it('Test roundNumber', () => {
  expect(vtkMath.roundNumber(1)).toBe(1);
  expect(vtkMath.roundNumber(1, 1)).toBe(1);
  expect(vtkMath.roundNumber(1.4)).toBe(1);
  expect(vtkMath.roundNumber(1.4, 0)).toBe(1);
  expect(vtkMath.roundNumber(1.4, 1)).toBe(1.4);
  expect(vtkMath.roundNumber(1.4, 2)).toBe(1.4);
  expect(vtkMath.roundNumber(1.46, 0)).toBe(1);
  expect(vtkMath.roundNumber(1.46, 1)).toBe(1.5);
  expect(vtkMath.roundNumber(1.46, 2)).toBe(1.46);
  expect(vtkMath.roundNumber(123.46, 0)).toBe(123);
  expect(vtkMath.roundNumber(123.46, 1)).toBe(123.5);
  expect(vtkMath.roundNumber(123.46, 2)).toBe(123.46);
  expect(vtkMath.roundNumber(6.06627640054528e-14, 6)).toBe(0);
  expect(vtkMath.roundNumber(-6.06627640054528e-14, 6)).toBe(0);
  expect(vtkMath.roundNumber(1.23456e3, 2)).toBe(1234.56);
});

it('Test areEquals', () => {
  const a1 = [1];
  const a2 = [1, 0];
  const a3 = [1, 0, 0];
  const b3 = [1 + 1e-7, 0, 0];
  expect(vtkMath.areEquals(a1, a1)).toBeTruthy();
  expect(vtkMath.areEquals(a2, a2)).toBeTruthy();
  expect(vtkMath.areEquals(a3, a3)).toBeTruthy();
  expect(vtkMath.areEquals(a1, a2)).toBeFalsy();
  expect(vtkMath.areEquals(a3, a2)).toBeFalsy();
  expect(vtkMath.areEquals(a3, a3, 0)).toBeTruthy();
  expect(vtkMath.areEquals(a3, b3, 0)).toBeFalsy();
  expect(vtkMath.areEquals(a3, b3, 1e-8)).toBeFalsy();
  expect(vtkMath.areEquals(a3, b3, 2e-7)).toBeTruthy();
  expect(vtkMath.areEquals(a3, b3, 1e-6)).toBeTruthy();
});

it('Test outer2D', () => {
  const zeroVect = [0, 0];
  const x = [1, 2];
  const y = [2, 3];
  const zeroMatrix = [0, 0, 0, 0];
  const res = [0, 0, 0, 0];
  vtkMath.outer2D(zeroVect, zeroMatrix, res);
  expect(vtkMath.areEquals(res, zeroMatrix)).toBeTruthy();
  vtkMath.outer2D(x, y, res);
  expect(vtkMath.areEquals(res, [2, 3, 4, 6])).toBeTruthy();
});

it('Test outer', () => {
  const zeroVect = [0, 0, 0];
  const x = [1, 2, 3];
  const y = [2, 2, 3];
  const zeroMatrix = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const res = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  vtkMath.outer(zeroVect, zeroMatrix, res);
  expect(vtkMath.areEquals(res, zeroMatrix)).toBeTruthy();
  vtkMath.outer(x, y, res);
  expect(vtkMath.areEquals(res, [2, 2, 3, 4, 4, 6, 6, 6, 9])).toBeTruthy();
});

it('Test Identity3x3', () => {
  const m = [0, 2, 1, 2, 4, 0, 4, 0, 7];
  vtkMath.identity3x3(m);
  expect(vtkMath.areEquals(m, [1, 0, 0, 0, 1, 0, 0, 0, 1])).toBeTruthy();
});

it('Test Identity', () => {
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
  expect(vtkMath.areEquals(m, Id)).toBeTruthy();
  expect(vtkMath.areEquals(returnedMatrix, Id)).toBeTruthy();
  const voidMatrix = [];
  expect(vtkMath.areEquals(vtkMath.identity(4, voidMatrix), Id)).toBeTruthy();
});

it('Test transpose3x3', () => {
  const m = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const id = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const m1 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  vtkMath.transpose3x3(id, m);
  expect(vtkMath.areEquals(m, id)).toBeTruthy();
  vtkMath.transpose3x3(m1, m);
  expect(vtkMath.areEquals(m, [1, 4, 7, 2, 5, 8, 3, 6, 9])).toBeTruthy();
});

it('Test normalize', () => {
  const x = [1, 2, 3];
  const res1 = vtkMath.normalize(x);
  expect(res1 === Math.sqrt(14)).toBeTruthy();
  expect(x[0] === 1 / Math.sqrt(14)).toBeTruthy();
  expect(x[1] === 2 / Math.sqrt(14)).toBeTruthy();
  expect(x[2] === 3 / Math.sqrt(14)).toBeTruthy();
});

it('Test normalize4D', () => {
  const x = [2, 3, 4, 5];
  const res1 = vtkMath.normalize4D(x);
  expect(res1 === Math.sqrt(29)).toBeTruthy();
  expect(x[0] === 2 / Math.sqrt(29)).toBeTruthy();
  expect(x[1] === 3 / Math.sqrt(29)).toBeTruthy();
  expect(x[2] === 4 / Math.sqrt(29)).toBeTruthy();
  expect(x[3] === 5 / Math.sqrt(29)).toBeTruthy();
});

it('Test Multiply Matrix', () => {
  const nullMatrix = [0, 0, 0, 0];
  const m2x2 = [1, 1, 2, 4];
  const m1 = [1, 1];
  const m2 = [2, 3, 3, 1, 1, 2, 1, 2];
  const m3 = [2, -3, 3, 1, -1, 2, -1, -1];
  const resMat = [0, 0, 0];

  vtkMath.multiplyMatrix(m2x2, nullMatrix, 2, 2, 2, 2, resMat);
  expect(vtkMath.areEquals(resMat, nullMatrix)).toBeTruthy();

  vtkMath.multiplyMatrix(m1, m2, 1, 2, 2, 4, resMat);
  expect(vtkMath.areEquals(resMat, [3, 5, 4, 3])).toBeTruthy();

  vtkMath.multiplyMatrix(m2x2, m2, 2, 2, 2, 4, resMat);
  expect(vtkMath.areEquals(resMat, [3, 5, 4, 3, 8, 14, 10, 10])).toBeTruthy();

  vtkMath.multiplyMatrix(m2x2, m3, 2, 2, 2, 4, resMat);
  expect(vtkMath.areEquals(resMat, [1, -1, 2, 0, 0, 2, 2, -2])).toBeTruthy();

  expect(vtkMath.multiplyMatrix(m2, m2x2, 2, 4, 2, 2, resMat)).toBeFalsy();
});
it('Test multiplyMatrix3x3', () => {
  const nullMatrix = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const m1 = [1, 2, 1, 2, 3, 1, 2, 1, 3];
  const m2 = [2, 3, 3, 1, 1, 2, 1, 2, 1];
  const m3 = [2, -3, 3, 1, -1, 2, -1, 2, -1];
  const resMat = [0, 0, 0, 0, 0, 0, 0, 0, 0];

  vtkMath.multiply3x3_mat3(m1, nullMatrix, resMat);
  expect(vtkMath.areEquals(resMat, nullMatrix)).toBeTruthy();

  vtkMath.multiply3x3_mat3(m1, m2, resMat);
  expect(
    vtkMath.areEquals(resMat, [5, 7, 8, 8, 11, 13, 8, 13, 11])
  ).toBeTruthy();

  vtkMath.multiply3x3_mat3(m1, m3, resMat);
  expect(
    vtkMath.areEquals(resMat, [3, -3, 6, 6, -7, 11, 2, -1, 5])
  ).toBeTruthy();
});

it('Test multiply 3x3 matrix with vect3', () => {
  const zeroVector = [0, 0, 0];
  const m1 = [1, 2, 1, 3, 2, 1, 1, 3, 2];
  const m2 = [1, -2, 1, 3, -2, 1, -1, -3, 2];
  const v1 = [2, 2, 3];
  const resMat = [0, 0, 0];

  vtkMath.multiply3x3_vect3(m1, zeroVector, resMat);
  expect(vtkMath.areEquals(resMat, zeroVector)).toBeTruthy();

  vtkMath.multiply3x3_vect3(m1, v1, resMat);
  expect(vtkMath.areEquals(resMat, [9, 13, 14])).toBeTruthy();

  vtkMath.multiply3x3_vect3(m2, v1, resMat);
  expect(vtkMath.areEquals(resMat, [1, 5, -2])).toBeTruthy();
});

it('Test determinant 2x2', () => {
  const p1 = [2, 3];
  const p2 = [1, 2];
  expect(vtkMath.determinant2x2(0, 0, 0, 0) === 0).toBeTruthy();
  expect(vtkMath.determinant2x2(2, 3, 1, 2) === 1).toBeTruthy();
  expect(vtkMath.determinant2x2(p1, p2) === 1).toBeTruthy();
});

it('Test determinant 3x3', () => {
  const m0 = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const m1 = [1, 2, 1, 2, 3, 1, 2, 2, 3];
  const d = [1, 0, 0, 0, 2, 0, 0, 0, 3];
  expect(vtkMath.determinant3x3(m0) === 0).toBeTruthy();
  expect(vtkMath.determinant3x3(m1) === -3).toBeTruthy();
  expect(vtkMath.determinant3x3(d) === 6).toBeTruthy();
});

it('Test invert3x3', () => {
  const m1 = [1, 2, 1, 2, 3, 1, 2, 2, 3];
  const mInverse = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const d = [1, 0, 0, 0, 2, 0, 0, 0, 3];
  vtkMath.invert3x3(d, mInverse);
  expect(
    vtkMath.areEquals(mInverse, [1, 0, 0, 0, 0.5, 0, 0, 0, 1 / 3])
  ).toBeTruthy();
  vtkMath.invert3x3(m1, mInverse);
  expect(
    vtkMath.areEquals(
      mInverse,
      [
        -2.333333, 1.333333, 0.333333, 1.333333, -0.333333, -0.333333, 0.666667,
        -0.666667, 0.333333,
      ]
    )
  ).toBeTruthy();
});

it('Test invertMatrix', () => {
  const m1 = [1, 2, 1, 1, 2, 3, 1, 1, 2, 2, 3, 1, 2, 3, 1, 2];
  let mInverse = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const d = [1, 0, 0, 0, 2, 0, 0, 0, 3];
  vtkMath.invertMatrix(d, mInverse, 3);
  expect(
    vtkMath.areEquals(mInverse, [1, 0, 0, 0, 0.5, 0, 0, 0, 1 / 3])
  ).toBeTruthy();
  mInverse = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  vtkMath.invertMatrix(m1, mInverse, 4);
  expect(
    vtkMath.areEquals(
      mInverse,
      [
        -2.333333, 0.666667, 0.333333, 0.666666, 1.333333, 0.333333, -0.333333,
        -0.666667, 0.666667, -0.333333, 0.333333, -0.333333, 0, -1, 0, 1,
      ]
    )
  ).toBeTruthy();
});

it('Test JacobiN', () => {
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
      expect(vtkMath.areEquals(result, expected)).toBeTruthy();
    }
  }
});

it('Test diagonalize', () => {
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
    expect(vtkMath.areEquals(result, expected)).toBeTruthy();
  }
  // Now test for 2 and 3 equal eigenvalues
  vtkMath.identity3x3(mat);
  mat[0] = 5.0;
  mat[4] = 5.0;
  mat[8] = 1.0;

  eigenVector = vtkMath.createArray(9);
  eigen = vtkMath.createArray(3);
  vtkMath.diagonalize3x3(mat, eigen, eigenVector);
  expect(vtkMath.areEquals(mat, [5, 0, 0, 0, 5, 0, 0, 0, 1])).toBeTruthy();

  vtkMath.identity3x3(mat);
  mat[0] = 2.0;
  mat[4] = 2.0;
  mat[8] = 2.0;

  eigenVector = vtkMath.createArray(9);
  eigen = vtkMath.createArray(3);
  vtkMath.diagonalize3x3(mat, eigen, eigenVector);
  expect(
    vtkMath.areEquals(eigenVector, [1, 0, 0, 0, 1, 0, 0, 0, 1])
  ).toBeTruthy();
});

it('Test Orthogonalize3x3', () => {
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
    expect(vtkMath.areEquals(matI, identity)).toBeTruthy();
  }
});

it('Test matrix3x3ToQuaternion', () => {
  const m0 = [-1, 0, 0, 0, -1, 0, 0, 0, 1];
  const m1 = [1, 1, 0, 1, -1, 0, 0, 0, 1];
  const quat4 = [0, 0, 0, 0];
  vtkMath.matrix3x3ToQuaternion(m0, quat4);
  expect(vtkMath.areEquals(quat4, [0, 0, 0, 1])).toBeTruthy();
  vtkMath.matrix3x3ToQuaternion(m1, quat4);
  expect(vtkMath.areEquals(quat4, [0.0, 0.92388, 0.382683, 0.0])).toBeTruthy();
});

it('Test quaternionToMatrix3x3', () => {
  const matRes = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const quat1 = [0, 0, 0, 1];
  const quat2 = [0.0, 0.5, 0.5, 0.5];
  vtkMath.quaternionToMatrix3x3(quat1, matRes);
  expect(vtkMath.areEquals(matRes, [-1, 0, 0, 0, -1, 0, 0, 0, 1])).toBeTruthy();
  vtkMath.quaternionToMatrix3x3(quat2, matRes);
  expect(
    vtkMath.areEquals(
      matRes,
      [
        -0.333333, 0.666667, 0.666667, 0.666667, -0.333333, 0.666667, 0.666667,
        0.666667, -0.333333,
      ]
    )
  ).toBeTruthy();
});

it('Test multiplyQuaternion', () => {
  const quat1 = [0, 0, 0, 1];
  const quat2 = [0, 0.5, 0.5, 0.5];
  const quatRes = [0, 0, 0, 0];
  vtkMath.multiplyQuaternion(quat1, quat2, quatRes);
  expect(vtkMath.areEquals(quatRes, [-0.5, -0.5, 0.5, 0.0])).toBeTruthy();
});

it('Test EstimateMatrixCondition', () => {
  let res = vtkMath.estimateMatrixCondition([0, 0, 0, 0], 2);
  expect(res === Number.MAX_VALUE).toBeTruthy();
  res = vtkMath.estimateMatrixCondition([2, 2, 0, 2], 2);
  expect(res === 1).toBeTruthy();
  res = vtkMath.estimateMatrixCondition([2, 4, 0, -2], 2);
  expect(res === 2).toBeTruthy();
});

it('Test solveHomogeneousLeastSquares', () => {
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
  expect(vtkMath.areEquals(expected, m)).toBeTruthy();
  expect(vtkMath.solveHomogeneousLeastSquares(3, x, 4, m) === 0).toBeTruthy();
});

it('Test solveLeastSquares', () => {
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

  expect(vtkMath.areEquals(expecteds, m)).toBeTruthy();

  // Now make one solution homogenous
  y[0] = -5.0;
  y[1] = -1.0;
  y[2] = 0.0;
  vtkMath.solveLeastSquares(3, x, 2, y, 1, m);
  expecteds = [3.0, -2.0];
  expect(vtkMath.areEquals(expecteds, m)).toBeTruthy();

  // Now make all homogenous
  y[0] = 0.0;
  y[1] = 0.0;
  y[2] = 0.0;
  vtkMath.solveLeastSquares(3, x, 2, y, 1, m);
  const mHomogenous = vtkMath.createArray(2);
  vtkMath.solveHomogeneousLeastSquares(3, x, 2, mHomogenous);
  expect(vtkMath.areEquals(m, mHomogenous)).toBeTruthy();

  // Insufficient number of samples. Underdetermined.
  expect(vtkMath.solveLeastSquares(1, x, 2, y, 1, m) !== 0).toBeFalsy();
});

it('Test solveLinearSystem', () => {
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

      expect(vtkMath.areEquals(lhs, rhs)).toBeTruthy();

      if (NDimension === 1 || NDimension === 2) {
        for (let i = 0; i < NDimension; i++) {
          for (let j = 0; j < NDimension; j++) {
            mat[i * NDimension + j] = 0.0;
          }
        }
        expect(
          vtkMath.solveLinearSystem(mat, rhs, NDimension) === 0.0
        ).toBeTruthy();
      }
    }
  }
});

it('Test linearSolve3x3', () => {
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
    expect(vtkMath.areEquals(lhs, solution)).toBeTruthy();
  }
});

it('Test luSolve3x3 and luFactor', () => {
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
    expect(vtkMath.areEquals(lhs, rhs)).toBeTruthy();
  }
});

it('Test singularValueDecomposition', () => {
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
    expect(vtkMath.areEquals(m, orig)).toBeTruthy();
  }
});

it('Test getMajorAxisIndex / getMinorAxisIndex', () => {
  expect(vtkMath.getMajorAxisIndex([-1, 3, -0.2])).toBe(1);
  expect(vtkMath.getMinorAxisIndex([-1, 3, -0.2])).toBe(2);
  expect(vtkMath.getMinorAxisIndex([0.5, -0.5, 2])).toBe(0);
  expect(vtkMath.getMinorAxisIndex([])).toBe(-1);
});

it('Test getSparseOrthogonalMatrix', () => {
  const tests = [
    {
      matrix: [
        0.702, 0.7025, -0.1163, -0.2856, 0.1281, -0.9497, -0.6523, 0.7, 0.2906,
      ],
      expected: [0, 1, 0, 0, 0, -1, -1, 0, 0],
    },
  ];

  // Test all matrices of size 3x3 which are orthogonal and contain only -1, 1 and 0
  // There are 6 x 8 = 54 matrices to test
  const permutation = [0, 1, 2];
  for (let permutationIdx = 0; permutationIdx < 6; ++permutationIdx) {
    for (let signBitField = 0; signBitField < 8; ++signBitField) {
      const matrix = new Array(9).fill(0);
      for (let row = 0; row < permutation.length; ++row) {
        const col = permutation[row];
        // eslint-disable-next-line no-bitwise
        matrix[row + 3 * col] = signBitField & (1 << row) ? -1 : 1;
      }
      tests.push({ matrix, expected: matrix });
    }
    // Next permutation
    if (permutationIdx % 2 === 0) {
      [permutation[0], permutation[1]] = [permutation[1], permutation[0]];
    } else {
      [permutation[1], permutation[2]] = [permutation[2], permutation[1]];
    }
  }

  tests.forEach(({ matrix, expected }) => {
    const outputMatrix = vtkMath.getSparseOrthogonalMatrix(matrix);
    expect(vtkMath.areEquals(expected, outputMatrix, 0)).toBeTruthy();
  });
});
