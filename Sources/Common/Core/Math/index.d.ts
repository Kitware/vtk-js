import { types } from '@babel/core';
import { mat3, mat4, quat2, ReadonlyVec3, vec2, vec3 } from 'gl-matrix';

/**
 *
 * @param {number} size
 */
export function createArray(size?: number): number[];

/**
 * Get the number π.
 * @returns PI.
 */
export function Pi(): number;

/**
 * Convert degrees to radians.
 * @param {number} deg
 */
export function radiansFromDegrees(deg: number): number;

/**
 * Convert radians to degrees.
 * @param {number} rad
 */
export function degreesFromRadians(rad: number): number;

/**
 * Same as Math.round().
 * @param {number} param1
 */
export function round(param1: number): number;

/**
 * Same as Math.floor().
 * @param {number} param1
 */
export function floor(param1: number): number;

/**
 * Same as Math.ceil().
 * @param {number} param1
 */
export function ceil(param1: number): number;

/**
 * Returns the minimum of the two arguments provided. If either argument is NaN,
 * the first argument will always be returned.
 * @param {number} param1
 * @param {number} param2
 */
export function min(param1: number, param2: number): number;

/**
 * Returns the maximum of the two arguments provided. If either argument is NaN,
 * the first argument will always be returned.
 * @param {number} param1
 * @param {number} param2
 */
export function max(param1: number, param2: number): number;

/**
 * Minimum of the array.
 * @param {number[]} arr
 * @param {number} offset
 * @param {number} stride
 */
export function arrayMin(arr: number[], offset: number, stride: number): number;

/**
 * Maximum of the array.
 * @param {number[]} arr
 * @param {number} offset
 * @param {number} stride
 */
export function arrayMax(arr: number[], offset: number, stride: number): number;

/**
 *
 * @param {number[]} arr
 * @param {number} offset
 * @param {number} stride
 */
export function arrayRange(arr: number[], offset: number, stride: number): number[];

/**
 * Gives the exponent of the lowest power of two not less than x.
 */
export function ceilLog2(): void;

/**
 * Compute N factorial, N! = N*(N-1) * (N-2)...*3*2*1.
 */
export function factorial(): void;

/**
 * Generate pseudo-random numbers distributed according to the standard normal
 * distribution.
 */
export function gaussian(): void;

/**
 * Compute the nearest power of two that is not less than x.
 * @param {number} xi
 */
export function nearestPowerOfTwo(xi: number): number;

/**
 * Returns true if integer is a power of two.
 * @param {number} x
 */
export function isPowerOfTwo(x: number): boolean;

/**
 * The number of combinations of n objects from a pool of m objects (m>n).
 * @param {number} m
 * @param {number} n
 */
export function binomial(m: number, n: number): number;

/**
 * Start iterating over "m choose n" objects.
 * @param {number} [m]
 * @param {number} [n]
 */
export function beginCombination(m?: number, n?: number): number;

/**
 * Given m, n, and a valid combination of n integers in the range [0,m[, this
 * function alters the integers into the next combination in a sequence of all
 * combinations of n items from a pool of m.
 * @param {number} m
 * @param {number} n
 * @param {number[]} r
 */
export function nextCombination(m: number, n: number, r: number[]): number;

/**
 * Initialize seed value.
 * @param {number} seed
 */
export function randomSeed(seed: number): void;

/**
 * Return the current seed used by the random number generator.
 */
export function getSeed(): number;

/**
 * Generate pseudo-random numbers distributed according to the uniform
 * distribution between min and max.
 * @param {number} minValue
 * @param {number} maxValue
 */
export function random(minValue: number, maxValue: number): number;

/**
 * Addition of two 3-vectors (float version).
 * @param {number[]} a
 * @param {number[]} b
 * @param {number[]} out
 * @example
 * ```js
 * a[3] + b[3] => out[3]
 * ```
 */
export function add(a: number[], b: number[], out: number[]): number[];

/**
 *
 * @param {number[]} a
 * @param {number[]} b
 * @param {number[]} out
 * @example
 * ```js
 * a[3] - b[3] => out[3]
 * ```
 */
export function subtract(a: number[], b: number[], out: number[]): number[];

/**
 *
 * @param {vec3} vec
 * @param {number} scalar
 * @example
 * ```js
 * vec[3] * scalar => vec[3]
 * ```
 */
export function multiplyScalar(vec: vec3, scalar: number): number[];

/**
 *
 * @param {vec2} vec
 * @param {number} scalar
 * @example
 * ```js
 * vec[3] * scalar => vec[3]
 * ```
 */
export function multiplyScalar2D(vec: vec2, scalar: number): number[];

/**
 *
 * @param {number[]} a
 * @param {number[]} b
 * @param {number} scalar
 * @param {number[]} out
 * @example
 * ```js
 * a[3] +  b[3] * scalar => out[3]
 * ```
 */
export function multiplyAccumulate(a: number[], b: number[], scalar: number, out: number[]): number[];

/**
 *
 * @param {number[]} a
 * @param {number[]} b
 * @param {number} scalar
 * @param {number[]} out
 * @example
 * ```js
 * a[2] + b[2] * scalar => out[2]
 * ```
 */
export function multiplyAccumulate2D(a: number[], b: number[], scalar: number, out: number[]): number[];

/**
 *
 * @param {number[]} x
 * @param {number[]} y
 * @example
 * ```js
 * a[2] + b[2] * scalar => out[2]
 * ```
 */
export function dot(x: number[], y: number[]): number;

/**
 *
 * @param {number[]} x
 * @param {number[]} y
 * @param {mat3} out_3x3
 */
export function outer(x: number[], y: number[], out_3x3: mat3): void;

/**
 * Computes cross product of 3D vectors x and y.
 * Returns out.
 * It is safe to x or y as out.
 * @param {number[]} x
 * @param {number[]} y
 * @param {number[]} out
 */
export function cross(x: number[], y: number[], out: number[]): number[];

/**
 *
 * @param {number[]} x
 * @param {number} n
 */
export function norm(x: number[], n: number): number;

/**
 * Normalize in place. Returns norm.
 * @param {number[]} x
 */
export function normalize(x: number[]): number;

/**
 *
 * @param {number[]} x
 * @param {number[]} y
 * @param {number[]} z
 * @param {number} theta
 */
export function perpendiculars(x: number[], y: number[], z: number[], theta: number): void;

/**
 *
 * @param {number[]} a
 * @param {number[]} b
 * @param {number[]} projection
 */
export function projectVector(a: number[], b: number[], projection: number[]): boolean;

/**
 *
 * @param {number[]} x
 * @param {number[]} y
 */
export function dot2D(x: number[], y: number[]): number;

/**
 *
 * @param {number[]} a
 * @param {number[]} b
 * @param projection
 */
export function projectVector2D(a: number[], b: number[], projection: number[]): boolean;

/**
 *
 * @param {number[]} x
 * @param {number[]} y
 */
export function distance2BetweenPoints(x: number[], y: number[]): number;

/**
 * Angle between 3D vectors
 * @param {vec3} v1
 * @param {vec3} v2
 */
export function angleBetweenVectors(v1: vec3, v2: vec3): number;


/**
 * Signed angle between v1 and v2 with regards to plane defined by normal vN.
 * angle between v1 and v2 with regards to plane defined by normal vN.Signed
 * angle between v1 and v2 with regards to plane defined by normal
 * vN.t3(mat_3x3, in_3, out_3)
 * @param {vec3} v1
 * @param {vec3} v2
 * @param {vec3} vN
 */
export function signedAngleBetweenVectors(v1: vec3, v2: vec3, vN: vec3): number;


/**
 *
 * @param {number} mean
 * @param {number} variance
 * @param {number} position
 */
export function gaussianAmplitude(mean: number, variance: number, position: number): number;

/**
 *
 * @param {number} mean
 * @param {number} variance
 * @param {number} position
 */
export function gaussianWeight(mean: number, variance: number, position: number): number;

/**
 *
 * @param {number[]} x
 * @param {number[]} y
 * @param {number[]} out_2x2
 */
export function outer2D(x: number[], y: number[], out_2x2: number[]): void;

/**
 *
 * @param {number[]} x2D
 */
export function norm2D(x2D: number[]): number;

/**
 *
 * @param {number[]} x
 */
export function normalize2D(x: number[]): number;

/**
 *
 * @param {number[]} args
 */
export function determinant2x2(args: number[]): number;

/**
 *
 * @param {mat3} mat_3x3
 * @param {number[]} index_3
 */
export function LUFactor3x3(mat_3x3: mat3, index_3: number[]): void;

/**
 *
 * @param {mat3} mat_3x3
 * @param {number[]} index_3
 * @param {number[]} x_3
 */
export function LUSolve3x3(mat_3x3: mat3, index_3: number[], x_3: number[]): void;

/**
 *
 * @param {mat3} mat_3x3
 * @param {number[]} x_3
 * @param {number[]} y_3
 */
export function linearSolve3x3(mat_3x3: mat3, x_3: number[], y_3: number[]): void;

/**
 *
 * @param {mat3} mat_3x3
 * @param {vec3} in_3
 * @param {vec3} out_3
 */
export function multiply3x3_vect3(mat_3x3: mat3, in_3: vec3, out_3: vec3): void;

/**
 *
 * @param {mat3} a_3x3
 * @param {mat3} b_3x3
 * @param {mat3} out_3x3
 */
export function multiply3x3_mat3(a_3x3: mat3, b_3x3: mat3, out_3x3: mat3): void;

/**
 *
 * @param {number[]} a
 * @param {number[]} b
 * @param {number} rowA
 * @param {number} colA
 * @param {number} rowB
 * @param {number} colB
 * @param {number[]} out_rowXcol
 */
export function multiplyMatrix(a: number[], b: number[], rowA: number, colA: number, rowB: number, colB: number, out_rowXcol: number[]): void;

/**
 *
 * @param {mat3} in_3x3
 * @param {number[]} outT_3x3
 */
export function transpose3x3(in_3x3: mat3, outT_3x3: number[]): void;

/**
 *
 * @param {mat3} in_3x3
 * @param {number[]} outI_3x3
 */
export function invert3x3(in_3x3: mat3, outI_3x3: number[]): void;

/**
 *
 * @param {mat3} mat_3x3
 */
export function identity3x3(mat_3x3: mat3): void;

/**
 *
 * @param {mat3} mat_3x3
 */
export function determinant3x3(mat_3x3: mat3): number;

/**
 *
 * @param {number[]} quat_4
 * @param {mat3} mat_3x3
 */
export function quaternionToMatrix3x3(quat_4: number[], mat_3x3: mat3): void;

/**
 *
 * @param {number[]} a
 * @param {number[]} b
 * @param {number} eps
 */
export function areEquals(a: number[], b: number[], eps: number): boolean;

/**
 *
 * @param {number} num
 * @param {number} [digits]
 */
export function roundNumber(num: number, digits?: number): number;

/**
 *
 * @param {vec3} vector
 * @param {number[]} [out]
 * @param {number} [digits]
 */
export function roundVector(vector: vec3, out?: number[], digits?: number): number[];

/**
 *
 * @param {number[]} a
 * @param {number} n
 * @param {number[]} w
 * @param {number[]} v
 */
export function jacobiN(a: number[], n: number, w: number[], v: number[]): number;

/**
 *
 * @param {mat3} mat_3x3
 * @param {number[]} quat_4
 */
export function matrix3x3ToQuaternion(mat_3x3: mat3, quat_4: number[]): void;

/**
 *
 * @param {number[]} quat_1
 * @param {number[]} quat_2
 * @param {number[]} quat_out
 */
export function multiplyQuaternion(quat_1: number[], quat_2: number[], quat_out: number[]): void;

/**
 *
 * @param {mat3} a_3x3
 * @param {mat3} out_3x3
 */
export function orthogonalize3x3(a_3x3: mat3, out_3x3: mat3): void;

/**
 *
 * @param {mat3} a_3x3
 * @param {vec3} w_3
 * @param {mat3} v_3x3
 */
export function diagonalize3x3(a_3x3: mat3, w_3: vec3, v_3x3: mat3): void;

/**
 *
 * @param {mat3} a_3x3
 * @param {mat3} u_3x3
 * @param {vec3} w_3
 * @param {mat3} vT_3x3
 */
export function singularValueDecomposition3x3(a_3x3: mat3, u_3x3: mat3, w_3: vec3, vT_3x3: mat3): void;

/**
 *
 * @param {number[]} A
 * @param {number[]} index
 * @param {number} size
 */
export function luFactorLinearSystem(A: number[], index: number[], size: number): number;

/**
 *
 * @param {number[]} A
 * @param {number[]} index
 * @param x
 * @param {number} size
 */
export function luSolveLinearSystem(A: number[], index: number[], x: number[], size: number): void;

/**
 *
 * @param {number[]} A
 * @param {number[]} x
 * @param {number} size
 */
export function solveLinearSystem(A: number[], x: number[], size: number): number;

/**
 *
 * @param {number[]} A
 * @param {number[]} AI
 * @param {number} size
 * @param {?} [index]
 * @param {?} [column]
 */
export function invertMatrix(A: number[], AI: number[], size: number, index?: any, column?: any): number;

/**
 *
 * @param {number[]} A
 * @param {number} size
 */
export function estimateMatrixCondition(A: number[], size: number): number;

/**
 *
 * @param {mat3} a_3x3
 * @param {number[]} w
 * @param {number[]} v
 */
export function jacobi(a_3x3: mat3, w: number[], v: number[]): number;

/**
 *
 * @param {number} numberOfSamples
 * @param {number[]} xt
 * @param {number} xOrder
 * @param {number[]} mt
 */
export function solveHomogeneousLeastSquares(numberOfSamples: number, xt: number[], xOrder: number, mt: number[]): number;

/**
 *
 * @param {number} numberOfSamples
 * @param {number[]} xt
 * @param {number} xOrder
 * @param {number[]} yt
 * @param {number} yOrder
 * @param {number[]} mt
 * @param {boolean} checkHomogeneous
 */
export function solveLeastSquares(numberOfSamples: number, xt: number[], xOrder: number, yt: number[], yOrder: number, mt: number[], checkHomogeneous: boolean): number;

/**
 *
 * @param {string} hexStr
 * @param {number[]} outFloatArray
 */
export function hex2float(hexStr: string, outFloatArray: number[]): number[];

/**
 *
 * @param {number[]} rgb
 * @param {number[]} hsv
 */
export function rgb2hsv(rgb: number[], hsv: number[]): void;

/**
 *
 * @param {number[]} hsv
 * @param {number[]} rgb
 */
export function hsv2rgb(hsv: number[], rgb: number[]): void;

/**
 *
 * @param {number[]} lab
 * @param {number[]} xyz
 */
export function lab2xyz(lab: number[], xyz: number[]): void;

/**
 *
 * @param {number[]} xyz
 * @param {number[]} lab
 */
export function xyz2lab(xyz: number[], lab: number[]): void;

/**
 *
 * @param {number[]} xyz
 * @param {number[]} rgb
 */
export function xyz2rgb(xyz: number[], rgb: number[]): void;

/**
 *
 * @param {number[]} rgb
 * @param {number[]} xyz
 */
export function rgb2xyz(rgb: number[], xyz: number[]): void;

/**
 *
 * @param {number[]} rgb
 * @param {number[]} lab
 */
export function rgb2lab(rgb: number[], lab: number[]): void;

/**
 *
 * @param {number[]} lab
 * @param {number[]} rgb
 */
export function lab2rgb(lab: number[], rgb: number[]): void;

/**
 *
 * @param {number[]} bounds
 */
export function uninitializeBounds(bounds: number[]): void;

/**
 *
 * @param {number[]} bounds
 */
export function areBoundsInitialized(bounds: number[]): boolean;

/**
 *
 * @param {number[]} point1
 * @param {number[]} point2
 * @param {number[]} bounds
 */
export function computeBoundsFromPoints(point1: number[], point2: number[], bounds: number[]): void;

/**
 *
 * @param {number} value
 * @param {number} minValue
 * @param {number} maxValue
 */
export function clampValue(value: number, minValue: number, maxValue: number): number[];

/**
 *
 * @param {number[]} vector
 * @param {number[]} minVector
 * @param {number[]} maxVector
 * @param {number[]} out
 */
export function clampVector(vector: number[], minVector: number[], maxVector: number[], out: number[]): number[];

/**
 *
 * @param {number[]} vector
 * @param {number[]} out
 */
export function roundVector(vector: number[], out: number[]): number[];

/**
 *
 * @param {number} value
 * @param {number[]} range
 */
export function clampAndNormalizeValue(value: number, range: number[]): number;

/**
 *
 */
export function getScalarTypeFittingRange(): void;

/**
 *
 */
export function getAdjustedScalarRange(): void;

/**
 *
 * @param {number[]} extent1
 * @param {number[]} extent2
 */
export function extentIsWithinOtherExtent(extent1: number[], extent2: number[]): number;

/**
 *
 * @param {number[]} bounds1_6
 * @param {number[]} bounds2_6
 * @param {number[]} delta_3
 */
export function boundsIsWithinOtherBounds(bounds1_6: number[], bounds2_6: number[], delta_3: number[]): number;

/**
 *
 * @param {number[]} point_3
 * @param {number[]} bounds_6
 * @param {number[]} delta_3
 */
export function pointIsWithinBounds(point_3: number[], bounds_6: number[], delta_3: number[]): number;

/**
 * Determines whether the passed value is a infinite number.
 * @param {number} value
 */
export function isInf(value: number): boolean;

/**
 *
 */
export function createUninitializedBounds(): number[];

/**
 *
 * @param {number[]} vector
 */
export function getMajorAxisIndex(vector: number[]): number;

/**
 *
 * @param {number} value
 */
export function floatToHex2(value: number): string;

/**
 *
 * @param {number[]} rgbArray
 * @param {string} [prefix]
 */
export function floatRGB2HexCode(rgbArray: number[], prefix?: string): string;

/**
 *
 * @param {number[]} rgbArray
 */
export function float2CssRGBA(rgbArray: number[]): string;

/**
 * Determines whether the passed value is a NaN.
 * @param {number} value
 */
export function isNan(value: number): boolean;

/**
 * Determines whether the passed value is a NaN.
 * @param {number} value
 */
export function isNaN(value: number): boolean;

/**
 * Determines whether the passed value is a finite number.
 * @param value
 */
export function isFinite(value: any): boolean;

/**
 * vtkMath provides methods to perform common math operations. These include
 * providing constants such as Pi; conversion from degrees to radians; vector
 * operations such as dot and cross products and vector norm; matrix determinant
 * for 2x2 and 3x3 matrices; univariate polynomial solvers; and for random
 * number generation (for backward compatibility only).
 */
export declare const vtkMath: {
	createArray: typeof createArray;
	Pi: typeof Pi;
	radiansFromDegrees: typeof radiansFromDegrees;
	degreesFromRadians: typeof degreesFromRadians;
	round: typeof round;
	floor: typeof floor;
	ceil: typeof ceil;
	min: typeof min;
	max: typeof max;
	arrayMin: typeof arrayMin;
	arrayMax: typeof arrayMax;
	arrayRange: typeof arrayRange;
	ceilLog2: typeof ceilLog2;
	factorial: typeof factorial;
	gaussian: typeof gaussian;
	nearestPowerOfTwo: typeof nearestPowerOfTwo;
	isPowerOfTwo: typeof isPowerOfTwo;
	binomial: typeof binomial;
	beginCombination: typeof beginCombination;
	nextCombination: typeof nextCombination;
	randomSeed: typeof randomSeed;
	getSeed: typeof getSeed;
	random: typeof random;
	add: typeof add;
	subtract: typeof subtract;
	multiplyScalar: typeof multiplyScalar;
	multiplyScalar2D: typeof multiplyScalar2D;
	multiplyAccumulate: typeof multiplyAccumulate;
	multiplyAccumulate2D: typeof multiplyAccumulate2D;
	dot: typeof dot;
	outer: typeof outer;
	cross: typeof cross;
	norm: typeof norm;
	normalize: typeof normalize;
	perpendiculars: typeof perpendiculars;
	projectVector: typeof projectVector;
	dot2D: typeof dot2D;
	projectVector2D: typeof projectVector2D;
	distance2BetweenPoints: typeof distance2BetweenPoints;
	angleBetweenVectors: typeof angleBetweenVectors;
	gaussianAmplitude: typeof gaussianAmplitude;
	gaussianWeight: typeof gaussianWeight;
	outer2D: typeof outer2D;
	norm2D: typeof norm2D;
	normalize2D: typeof normalize2D;
	determinant2x2: typeof determinant2x2;
	LUFactor3x3: typeof LUFactor3x3;
	LUSolve3x3: typeof LUSolve3x3;
	linearSolve3x3: typeof linearSolve3x3;
	multiply3x3_vect3: typeof multiply3x3_vect3;
	multiply3x3_mat3: typeof multiply3x3_mat3;
	multiplyMatrix: typeof multiplyMatrix;
	transpose3x3: typeof transpose3x3;
	invert3x3: typeof invert3x3;
	identity3x3: typeof identity3x3;
	determinant3x3: typeof determinant3x3;
	quaternionToMatrix3x3: typeof quaternionToMatrix3x3;
	areEquals: typeof areEquals;
	areMatricesEqual: typeof areEquals;
	roundNumber: typeof roundNumber;
	roundVector: typeof roundVector;
	jacobiN: typeof jacobiN;
	matrix3x3ToQuaternion: typeof matrix3x3ToQuaternion;
	multiplyQuaternion: typeof multiplyQuaternion;
	orthogonalize3x3: typeof orthogonalize3x3;
	diagonalize3x3: typeof diagonalize3x3;
	singularValueDecomposition3x3: typeof singularValueDecomposition3x3;
	luFactorLinearSystem: typeof luFactorLinearSystem;
	luSolveLinearSystem: typeof luSolveLinearSystem;
	solveLinearSystem: typeof solveLinearSystem;
	invertMatrix: typeof invertMatrix;
	estimateMatrixCondition: typeof estimateMatrixCondition;
	jacobi: typeof jacobi;
	solveHomogeneousLeastSquares: typeof solveHomogeneousLeastSquares;
	solveLeastSquares: typeof solveLeastSquares;
	hex2float: typeof hex2float;
	rgb2hsv: typeof rgb2hsv;
	hsv2rgb: typeof hsv2rgb;
	lab2xyz: typeof lab2xyz;
	xyz2lab: typeof xyz2lab;
	xyz2rgb: typeof xyz2rgb;
	rgb2xyz: typeof rgb2xyz;
	rgb2lab: typeof rgb2lab;
	lab2rgb: typeof lab2rgb;
	uninitializeBounds: typeof uninitializeBounds;
	areBoundsInitialized: typeof areBoundsInitialized;
	computeBoundsFromPoints: typeof computeBoundsFromPoints;
	clampValue: typeof clampValue;
	clampVector: typeof clampVector;
	clampAndNormalizeValue: typeof clampAndNormalizeValue;
	getScalarTypeFittingRange: typeof getScalarTypeFittingRange;
	getAdjustedScalarRange: typeof getAdjustedScalarRange;
	extentIsWithinOtherExtent: typeof extentIsWithinOtherExtent;
	boundsIsWithinOtherBounds: typeof boundsIsWithinOtherBounds;
	pointIsWithinBounds: typeof pointIsWithinBounds;
	solve3PointCircle: typeof solve3PointCircle;
	isInf: typeof isInf;
	createUninitializedBounds: typeof createUninitializedBounds;
	getMajorAxisIndex: typeof getMajorAxisIndex;
	floatToHex2: typeof floatToHex2;
	floatRGB2HexCode: typeof floatRGB2HexCode;
	float2CssRGBA: typeof float2CssRGBA;
	inf: number;
	negInf: number;
	isNan: typeof isNaN,
	isNaN: typeof isNaN;
	isFinite: typeof isFinite
}
export default vtkMath;
