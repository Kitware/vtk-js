### Pi() : Math.PI;

Return PI.

### radiansFromDegrees(degree) : radian

Convert degrees to radians.

### degreesFromRadians(radian) : degree

Convert radians to degrees.

### round(float): int

Same as Math.round().

### floor(float) : int

Same as Math.floor().

### ceil(float) : int

Same as Math.ceil().

### ceilLog2()

NOT IMPLEMENTED

### min(a, b)

Same as Math.min().

### max(a, b)

Same as Math.max().

### arrayMin(array)

Minimum of the array.

### arrayMax(a, b)

Maximum of the array.

### factorial(n) : number

NOT IMPLEMENTED

### binomial(m, n) : int

### beginCombination(m, n) : Array or null


### nextCombination(m, n, r) : Boolean

### randomSeed()

NOT IMPLEMENTED

### getSeed()

NOT IMPLEMENTED

### random(minValue = 0, maxValue = 1) : Number

### gaussian()

NOT IMPLEMENTED

### add(a, b, out) 

```js
a[3] + b[3] => out[3]
```

### subtract(a, b, out) 

```js
a[3] - b[3] => out[3]
```

### multiplyScalar(vec, scalar) {

```js
vec[3] * scalar => vec[3]
```

### multiplyScalar2D(vec, scalar)

```js
vec[2] * scalar => vec[2]
```

### dot(x, y)

### outer(x, y, out_3x3) 

### cross(x, y, out) 

### norm(x, n = 3)

### normalize(x)

Normalize in place

### perpendiculars(x, y, z, theta) 

### projectVector(a, b, projection)

### dot2D(x, y) 

### projectVector2D(a, b, projection)

### distance2BetweenPoints(x, y)

### angleBetweenVectors(v1, v2)

### gaussianAmplitude(mean, variance, position)

### gaussianWeight(mean, variance, position)

### outer2D(x, y, out_2x2)

### norm2D(x2D)

### normalize2D(x)

### determinant2x2(c1, c2)

### LUFactor3x3(mat_3x3, index_3)

### LUSolve3x3(mat_3x3, index_3, x_3) 

### linearSolve3x3(mat_3x3, x_3, y_3)

### multiply3x3_vect3(mat_3x3, in_3, out_3)

### multiply3x3_mat3(a_3x3, b_3x3, out_3x3) 

### multiplyMatrix(a, b, rowA, colA, rowB, colB, out_rowXcol) 

### transpose3x3(in_3x3, outT_3x3)

### invert3x3(in_3x3, outI_3x3)

### identity3x3(mat_3x3)

### determinant3x3(mat_3x3)

### quaternionToMatrix3x3(quat_4, mat_3x3) 

### jacobiN(a, n, w, v) 

### matrix3x3ToQuaternion(mat_3x3, quat_4) 

### multiplyQuaternion(quat_1, quat_2, quat_out)

### orthogonalize3x3(a_3x3, out_3x3) 

### diagonalize3x3(a_3x3, w_3, v_3x3) 

### singularValueDecomposition3x3(a_3x3, u_3x3, w_3, vT_3x3)

### luFactorLinearSystem(A, index, size) 

### luSolveLinearSystem(A, index, x, size) 

### solveLinearSystem(A, x, size)

### invertMatrix(A, AI, size, index = null, column = null) 

### estimateMatrixCondition(A, size)

### jacobi(a_3x3, w, v) 

```js
jacobiN(a_3x3, 3, w, v);
```

### solveHomogeneousLeastSquares(numberOfSamples, xt, xOrder, mt)

### solveLeastSquares(numberOfSamples, xt, xOrder, yt, yOrder, mt, checkHomogeneous = true)

### rgb2hsv(rgb, hsv) 

### hsv2rgb(hsv, rgb) 

### lab2xyz(lab, xyz) 

### xyz2lab(xyz, lab) 

### xyz2rgb(xyz, rgb) 

### rgb2xyz(rgb, xyz) 

### rgb2lab(rgb, lab)

### LabToRGB(lab, rgb) 

### uninitializeBounds(bounds)

### areBoundsInitialized(bounds) 

### clampValue(value, minValue, maxValue)

### clampAndNormalizeValue(value, range) 

### getScalarTypeFittingRange 

NOT IMPLEMENTED

### getAdjustedScalarRange 

NOT IMPLEMENTED

### extentIsWithinOtherExtent(extent1, extent2)

### boundsIsWithinOtherBounds(bounds1_6, bounds2_6, delta_3) 

### pointIsWithinBounds(point_3, bounds_6, delta_3)

### solve3PointCircle(p1, p2, p3, center) 

### inf()

### negInf()

### isInf(number) : Boolean

### isNan(?) : Boolean

### isFinite(number) : Boolean

### createUninitializedBouds() : new [6]
