## Introduction

vtkMath provides methods to perform common math operations. These include
providing constants such as Pi; conversion from degrees to radians; vector
operations such as dot and cross products and vector norm; matrix determinant
for 2x2 and 3x3 matrices; univariate polynomial solvers; and for random
number generation (for backward compatibility only).




## Methods


### LUFactor3x3




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **mat_3x3** | <span class="arg-type">mat3</span></br></span><span class="arg-required">required</span> |  |
| **index_3** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### LUSolve3x3




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **mat_3x3** | <span class="arg-type">mat3</span></br></span><span class="arg-required">required</span> |  |
| **index_3** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **x_3** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### Pi

Get the number π.

#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> | PI. |


### add

Addition of two 3-vectors (float version).


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **a** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **b** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **out** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### angleBetweenVectors

Angle between 3D vectors


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **v1** | <span class="arg-type">vec3</span></br></span><span class="arg-required">required</span> |  |
| **v2** | <span class="arg-type">vec3</span></br></span><span class="arg-required">required</span> |  |


### areBoundsInitialized




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **bounds** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### areEquals




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **a** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **b** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **eps** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### arrayMax

Maximum of the array.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **arr** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **offset** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **stride** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### arrayMin

Minimum of the array.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **arr** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **offset** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **stride** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### arrayRange




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **arr** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **offset** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **stride** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### beginCombination

Start iterating over "m choose n" objects.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **m** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **n** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### binomial

The number of combinations of n objects from a pool of m objects (m>n).


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **m** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **n** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### boundsIsWithinOtherBounds




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **bounds1_6** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **bounds2_6** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **delta_3** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### ceil

Same as Math.ceil().


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **param1** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### ceilLog2

Gives the exponent of the lowest power of two not less than x.



### clampAndNormalizeValue




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **value** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **range** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### clampValue




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **value** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **minValue** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **maxValue** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### clampVector




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **vector** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **minVector** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **maxVector** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **out** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### computeBoundsFromPoints




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **point1** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **point2** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **bounds** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### createArray




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **size** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### createUninitializedBounds





### cross

Computes cross product of 3D vectors x and y.
Returns out.
It is safe to x or y as out.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **out** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### degreesFromRadians

Convert radians to degrees.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **rad** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### determinant2x2




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **args** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### determinant3x3




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **mat_3x3** | <span class="arg-type">mat3</span></br></span><span class="arg-required">required</span> |  |


### diagonalize3x3




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **a_3x3** | <span class="arg-type">mat3</span></br></span><span class="arg-required">required</span> |  |
| **w_3** | <span class="arg-type">vec3</span></br></span><span class="arg-required">required</span> |  |
| **v_3x3** | <span class="arg-type">mat3</span></br></span><span class="arg-required">required</span> |  |


### distance2BetweenPoints




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### dot




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### dot2D




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### estimateMatrixCondition




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **A** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **size** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### extentIsWithinOtherExtent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **extent1** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **extent2** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### factorial

Compute N factorial, N! = N*(N-1) * (N-2)...*3*2*1.



### float2CssRGBA




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **rgbArray** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### floatRGB2HexCode




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **rgbArray** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **prefix** | <span class="arg-type">string</span></br></span><span class="arg-required">required</span> |  |


### floatToHex2




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **value** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### floor

Same as Math.floor().


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **param1** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### gaussian

Generate pseudo-random numbers distributed according to the standard normal
distribution.



### gaussianAmplitude




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **mean** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **variance** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **position** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### gaussianWeight




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **mean** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **variance** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **position** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### getAdjustedScalarRange





### getMajorAxisIndex




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **vector** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### getScalarTypeFittingRange





### getSeed

Return the current seed used by the random number generator.



### hex2float




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **hexStr** | <span class="arg-type">string</span></br></span><span class="arg-required">required</span> |  |
| **outFloatArray** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### hsv2rgb




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **hsv** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **rgb** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### identity3x3




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **mat_3x3** | <span class="arg-type">mat3</span></br></span><span class="arg-required">required</span> |  |


### invert3x3




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **in_3x3** | <span class="arg-type">mat3</span></br></span><span class="arg-required">required</span> |  |
| **outI_3x3** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### invertMatrix




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **A** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **AI** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **size** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **index** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **column** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### isFinite

Determines whether the passed value is a finite number.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **value** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### isInf

Determines whether the passed value is a infinite number.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **value** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### isNaN

Determines whether the passed value is a NaN.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **value** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### isNan

Determines whether the passed value is a NaN.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **value** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### isPowerOfTwo

Returns true if integer is a power of two.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### jacobi




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **a_3x3** | <span class="arg-type">mat3</span></br></span><span class="arg-required">required</span> |  |
| **w** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **v** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### jacobiN




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **a** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **n** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **w** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **v** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### lab2rgb




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **lab** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **rgb** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### lab2xyz




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **lab** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **xyz** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### linearSolve3x3




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **mat_3x3** | <span class="arg-type">mat3</span></br></span><span class="arg-required">required</span> |  |
| **x_3** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **y_3** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### luFactorLinearSystem




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **A** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **index** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **size** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### luSolveLinearSystem




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **A** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **index** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **size** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### matrix3x3ToQuaternion




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **mat_3x3** | <span class="arg-type">mat3</span></br></span><span class="arg-required">required</span> |  |
| **quat_4** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### max

Returns the maximum of the two arguments provided. If either argument is NaN,
the first argument will always be returned.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **param1** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **param2** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### min

Returns the minimum of the two arguments provided. If either argument is NaN,
the first argument will always be returned.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **param1** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **param2** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### multiply3x3_mat3




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **a_3x3** | <span class="arg-type">mat3</span></br></span><span class="arg-required">required</span> |  |
| **b_3x3** | <span class="arg-type">mat3</span></br></span><span class="arg-required">required</span> |  |
| **out_3x3** | <span class="arg-type">mat3</span></br></span><span class="arg-required">required</span> |  |


### multiply3x3_vect3




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **mat_3x3** | <span class="arg-type">mat3</span></br></span><span class="arg-required">required</span> |  |
| **in_3** | <span class="arg-type">vec3</span></br></span><span class="arg-required">required</span> |  |
| **out_3** | <span class="arg-type">vec3</span></br></span><span class="arg-required">required</span> |  |


### multiplyAccumulate




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **a** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **b** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **scalar** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **out** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### multiplyAccumulate2D




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **a** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **b** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **scalar** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **out** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### multiplyMatrix




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **a** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **b** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **rowA** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **colA** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **rowB** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **colB** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **out_rowXcol** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### multiplyQuaternion




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **quat_1** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **quat_2** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **quat_out** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### multiplyScalar




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **vec** | <span class="arg-type">vec3</span></br></span><span class="arg-required">required</span> |  |
| **scalar** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### multiplyScalar2D




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **vec** | <span class="arg-type">vec2</span></br></span><span class="arg-required">required</span> |  |
| **scalar** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### nearestPowerOfTwo

Compute the nearest power of two that is not less than x.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **xi** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### nextCombination

Given m, n, and a valid combination of n integers in the range [0,m[, this
function alters the integers into the next combination in a sequence of all
combinations of n items from a pool of m.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **m** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **n** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **r** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### norm




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **n** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### norm2D




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x2D** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### normalize

Normalize in place. Returns norm.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### normalize2D




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### orthogonalize3x3




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **a_3x3** | <span class="arg-type">mat3</span></br></span><span class="arg-required">required</span> |  |
| **out_3x3** | <span class="arg-type">mat3</span></br></span><span class="arg-required">required</span> |  |


### outer




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **out_3x3** | <span class="arg-type">mat3</span></br></span><span class="arg-required">required</span> |  |


### outer2D




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **out_2x2** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### perpendiculars




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **theta** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### pointIsWithinBounds




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **point_3** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **bounds_6** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **delta_3** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### projectVector




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **a** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **b** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **projection** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### projectVector2D




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **a** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **b** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **projection** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### quaternionToMatrix3x3




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **quat_4** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **mat_3x3** | <span class="arg-type">mat3</span></br></span><span class="arg-required">required</span> |  |


### radiansFromDegrees

Convert degrees to radians.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **deg** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### random

Generate pseudo-random numbers distributed according to the uniform
distribution between min and max.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **minValue** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **maxValue** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### randomSeed

Initialize seed value.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **seed** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### rgb2hsv




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **rgb** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **hsv** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### rgb2lab




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **rgb** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **lab** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### rgb2xyz




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **rgb** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **xyz** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### round

Same as Math.round().


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **param1** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### roundNumber




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **num** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **digits** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### roundVector




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **vector** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **out** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### roundVector




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **vector** | <span class="arg-type">vec3</span></br></span><span class="arg-required">required</span> |  |
| **out** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **digits** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### signedAngleBetweenVectors

Signed angle between v1 and v2 with regards to plane defined by normal vN.
angle between v1 and v2 with regards to plane defined by normal vN.Signed
angle between v1 and v2 with regards to plane defined by normal
vN.t3(mat_3x3, in_3, out_3)


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **v1** | <span class="arg-type">vec3</span></br></span><span class="arg-required">required</span> |  |
| **v2** | <span class="arg-type">vec3</span></br></span><span class="arg-required">required</span> |  |
| **vN** | <span class="arg-type">vec3</span></br></span><span class="arg-required">required</span> |  |


### singularValueDecomposition3x3




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **a_3x3** | <span class="arg-type">mat3</span></br></span><span class="arg-required">required</span> |  |
| **u_3x3** | <span class="arg-type">mat3</span></br></span><span class="arg-required">required</span> |  |
| **w_3** | <span class="arg-type">vec3</span></br></span><span class="arg-required">required</span> |  |
| **vT_3x3** | <span class="arg-type">mat3</span></br></span><span class="arg-required">required</span> |  |


### solveHomogeneousLeastSquares




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **numberOfSamples** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **xt** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **xOrder** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **mt** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### solveLeastSquares




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **numberOfSamples** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **xt** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **xOrder** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **yt** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **yOrder** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **mt** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **checkHomogeneous** | <span class="arg-type">boolean</span></br></span><span class="arg-required">required</span> |  |


### solveLinearSystem




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **A** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **x** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **size** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### subtract




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **a** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **b** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **out** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### transpose3x3




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **in_3x3** | <span class="arg-type">mat3</span></br></span><span class="arg-required">required</span> |  |
| **outT_3x3** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### uninitializeBounds




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **bounds** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### xyz2lab




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **xyz** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **lab** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### xyz2rgb




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **xyz** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **rgb** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


