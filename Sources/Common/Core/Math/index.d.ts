import { types } from '@babel/core';
import { mat3, mat4, quat2, ReadonlyVec3, vec3 } from 'gl-matrix';

/**
 * 
 * @param size 
 */
declare function createArray(size?: number): number[];

/**
 * Return PI.
 */
declare function Pi(): number;

/**
 * Convert degrees to radians.
 * @param deg 
 */
declare function radiansFromDegrees(deg: number): number;

/**
 * Convert radians to degrees.
 * @param rad 
 */
declare function degreesFromRadians(rad: number): number;

/**
 * Same as Math.round().
 * @param param1 
 */
declare function round(param1: number): number;

/**
 * Same as Math.floor().
 * @param param1 
 */
declare function floor(param1: number): number;

/**
 * Same as Math.ceil().
 * @param param1 
 */
declare function ceil(param1: number): number;

/**
 * Returns the minimum of the two arguments provided. If either argument is NaN,
 * the first argument will always be returned.
 * @param param1 
 * @param param2 
 */
declare function min(param1: number, param2: number): number;

/**
 * Returns the maximum of the two arguments provided. If either argument is NaN,
 * the first argument will always be returned.
 * @param param1 
 * @param param2 
 */
declare function max(param1: number, param2: number): number;

/**
 * Minimum of the array.
 * @param arr 
 * @param offset 
 * @param stride 
 */
declare function arrayMin(arr: number[], offset: number, stride: number): number;

/**
 * Maximum of the array.
 * @param arr 
 * @param offset 
 * @param stride 
 */
declare function arrayMax(arr: number[], offset: number, stride: number): number;

/**
 * 
 * @param arr 
 * @param offset 
 * @param stride 
 */
declare function arrayRange(arr: number[], offset: number, stride: number): number[];

/**
 * Gives the exponent of the lowest power of two not less than x.
 */
declare function ceilLog2(): void;

/**
 * Compute N factorial, N! = N*(N-1) * (N-2)...*3*2*1.
 */
declare function factorial(): void;

/**
 * Generate pseudo-random numbers distributed according to the standard normal
 * distribution.
 */
declare function gaussian(): void;

/**
 * Compute the nearest power of two that is not less than x.
 * @param xi 
 */
declare function nearestPowerOfTwo(xi: number): number;

/**
 * Returns true if integer is a power of two.
 * @param x 
 */
declare function isPowerOfTwo(x: number): boolean;

/**
 * The number of combinations of n objects from a pool of m objects (m>n).
 * @param m 
 * @param n 
 */
declare function binomial(m: number, n: number): number;

/**
 * Start iterating over "m choose n" objects.
 * @param m 
 * @param n 
 */
declare function beginCombination(m?: number, n?: number): number;

/**
 * Given m, n, and a valid combination of n integers in the range [0,m[, this
 * function alters the integers into the next combination in a sequence of all
 * combinations of n items from a pool of m.
 * @param m 
 * @param n 
 * @param r 
 */
declare function nextCombination(m: number, n: number, r: 2): number;

/**
 * Initialize seed value.
 * @param seed 
 */
declare function randomSeed(seed: number): void;

/**
 * Return the current seed used by the random number generator.
 */
declare function getSeed(): number;

/**
 * Generate pseudo-random numbers distributed according to the uniform
 * distribution between min and max.
 * @param minValue 
 * @param maxValue 
 */
declare function random(minValue: number, maxValue: number): number;

/**
 * Addition of two 3-vectors (float version).
 * @param a 
 * @param b 
 * @param out 
 * @example 
 * ```js
 * a[3] + b[3] => out[3]
 * ```
 */
declare function add(a: number[], b: number[], out: number[]): number[];

/**
 * 
 * @param a 
 * @param b 
 * @param out 
 * @example
 * ```js
 * a[3] - b[3] => out[3]
 * ```
 */
declare function subtract(a: number[], b: number[], out: number[]): number[];

/**
 * 
 * @param vec 
 * @param scalar 
 * @example 
 * ```js
 * vec[3] * scalar => vec[3]
 * ```
 */
declare function multiplyScalar(vec: number[], scalar: number): number[];

/**
 * 
 * @param vec 
 * @param scalar 
 * ```js
 * vec[3] * scalar => vec[3]
 * ```
 */
declare function multiplyScalar2D(vec: number[], scalar: number): number[];

/**
 * 
 * @param a 
 * @param b 
 * @param scalar 
 * @param out 
 * @example
 * ```js
 * a[3] +  b[3] * scalar => out[3]
 * ```
 */
declare function multiplyAccumulate(a: number[], b: number[], scalar: number, out: number[]): number[];

/**
 * 
 * @param a 
 * @param b 
 * @param scalar 
 * @param out 
 * @example
 * ```js
 * a[2] + b[2] * scalar => out[2]
 * ```
 */
declare function multiplyAccumulate2D(a: number[], b: number[], scalar: number, out: number[]): number[];

/**
 * 
 * @param x 
 * @param y 
 * @example
 * ```js
 * a[2] + b[2] * scalar => out[2]
 * ```
 */
declare function dot(x: number[], y: number[]): number;

/**
 * 
 * @param x 
 * @param y 
 * @param out_3x3 
 */
declare function outer(x: number[], y: number[], out_3x3: number[]): void;

/**
 * Computes cross product of 3D vectors x and y.
 * Returns out.
 * It is safe to x or y as out.
 * @param x 
 * @param y 
 * @param out 
 */
declare function cross(x: number[], y: number[], out: number[]): number[];

/**
 * 
 * @param x 
 * @param n 
 */
declare function norm(x: number[], n: number): number;

/**
 * Normalize in place. Returns norm.
 * @param x 
 */
declare function normalize(x: number[]): number;

/**
 * 
 * @param x 
 * @param y 
 * @param z 
 * @param theta 
 */
declare function perpendiculars(x: number[], y: number[], z: number[], theta: number): void;

/**
 * 
 * @param a 
 * @param b 
 * @param projection 
 */
declare function projectVector(a: number[], b: number[], projection: number[]): boolean;

/**
 * 
 * @param x 
 * @param y 
 */
declare function dot2D(x: number[], y: number[]): number;

/**
 * 
 * @param a 
 * @param b 
 * @param projection 
 */
declare function projectVector2D(a: number[], b: number[], projection: number[]): boolean;

/**
 * 
 * @param x 
 * @param y 
 */
declare function distance2BetweenPoints(x: number[], y: number[]): number;

/**
 * Angle between 3D vectors
 * @param v1 
 * @param v2 
 */
declare function angleBetweenVectors(v1: number[], v2: number[]): number;


/**
 * Signed angle between v1 and v2 with regards to plane defined by normal vN.
 * angle between v1 and v2 with regards to plane defined by normal vN.Signed
 * angle between v1 and v2 with regards to plane defined by normal
 * vN.t3(mat_3x3, in_3, out_3)
 * @param v1 
 * @param v2 
 * @param vN 
 */
declare function signedAngleBetweenVectors(v1: number[], v2: number[], vN: number[]): number;


/**
 * 
 * @param mean 
 * @param variance 
 * @param position 
 */
declare function gaussianAmplitude(mean: number, variance: number, position: number): number;

/**
 * 
 * @param mean 
 * @param variance 
 * @param position 
 */
declare function gaussianWeight(mean: number, variance: number, position: number): number;

/**
 * 
 * @param x 
 * @param y 
 * @param out_2x2 
 */
declare function outer2D(x: number[], y: number[], out_2x2: number[]): void;

/**
 * 
 * @param x2D 
 */
declare function norm2D(x2D: number[]): number;

/**
 * 
 * @param x 
 */
declare function normalize2D(x: number[]): number;

/**
 * 
 * @param args 
 */
declare function determinant2x2(...args: number[]): number;

/**
 * 
 * @param mat_3x3 
 * @param index_3 
 */
declare function LUFactor3x3(mat_3x3: mat3, index_3: number[]): void;

/**
 * 
 * @param mat_3x3 
 * @param index_3 
 * @param x_3 
 */
declare function LUSolve3x3(mat_3x3: mat3, index_3: number[], x_3: number[]): void;

/**
 * 
 * @param mat_3x3 
 * @param x_3 
 * @param y_3 
 */
declare function linearSolve3x3(mat_3x3: mat3, x_3: number[], y_3: number[]): void;

/**
 * 
 * @param mat_3x3 
 * @param in_3 
 * @param out_3 
 */
declare function multiply3x3_vect3(mat_3x3: mat3, in_3: vec3, out_3: vec3): void;

/**
 * 
 * @param a_3x3 
 * @param b_3x3 
 * @param out_3x3 
 */
declare function multiply3x3_mat3(a_3x3: mat3, b_3x3: mat3, out_3x3: mat3): void;

/**
 * 
 * @param a 
 * @param b 
 * @param rowA 
 * @param colA 
 * @param rowB 
 * @param colB 
 * @param out_rowXcol 
 */
declare function multiplyMatrix(a: number[], b: number[], rowA: number, colA: number, rowB: number, colB: number, out_rowXcol: number[]): void;

/**
 * 
 * @param in_3x3 
 * @param outT_3x3 
 */
declare function transpose3x3(in_3x3: mat3, outT_3x3: number[]): void;

/**
 * 
 * @param in_3x3 
 * @param outI_3x3 
 */
declare function invert3x3(in_3x3: mat3, outI_3x3: number[]): void;

/**
 * 
 * @param mat_3x3 
 */
declare function identity3x3(mat_3x3: mat3): void;

/**
 * 
 * @param mat_3x3 
 */
declare function determinant3x3(mat_3x3: mat3): number;

/**
 * 
 * @param quat_4 
 * @param mat_3x3 
 */
declare function quaternionToMatrix3x3(quat_4: number[], mat_3x3: mat3): void;

/**
 * 
 * @param a 
 * @param b 
 * @param eps 
 */
declare function areEquals(a: number[], b: number[], eps: number): boolean;

/**
 * 
 * @param num 
 * @param digits 
 */
declare function roundNumber(num: number, digits?: number): number;

/**
 * 
 * @param vector 
 * @param out 
 * @param digits 
 */
declare function roundVector(vector: vec3, out?: number[], digits?: number): number[];

/**
 * 
 * @param a 
 * @param n 
 * @param w 
 * @param v 
 */
declare function jacobiN(a: number[], n: number, w: number[], v: number[]): number;

/**
 * 
 * @param mat_3x3 
 * @param quat_4 
 */
declare function matrix3x3ToQuaternion(mat_3x3: mat3, quat_4: number[]): void;

/**
 * 
 * @param quat_1 
 * @param quat_2 
 * @param quat_out 
 */
declare function multiplyQuaternion(quat_1: number[], quat_2: number[], quat_out: number[]): void;

/**
 * 
 * @param a_3x3 
 * @param out_3x3 
 */
declare function orthogonalize3x3(a_3x3: mat3, out_3x3: mat3): void;

/**
 * 
 * @param a_3x3 
 * @param w_3 
 * @param v_3x3 
 */
declare function diagonalize3x3(a_3x3: mat3, w_3: number[], v_3x3: number[]): void;

/**
 * 
 * @param a_3x3 
 * @param u_3x3 
 * @param w_3 
 * @param vT_3x3 
 */
declare function singularValueDecomposition3x3(a_3x3: mat3, u_3x3: mat3, w_3: vec3, vT_3x3: mat3): void;

/**
 * 
 * @param A 
 * @param index 
 * @param size 
 */
declare function luFactorLinearSystem(A: number[], index: number[], size: number): number;

/**
 * 
 * @param A 
 * @param index 
 * @param x 
 * @param size 
 */
declare function luSolveLinearSystem(A: number[], index: number[], x: number[], size: number): void;

/**
 * 
 * @param A 
 * @param x 
 * @param size 
 */
declare function solveLinearSystem(A: number[], x: 1, size: number): number;

/**
 * 
 * @param A 
 * @param AI 
 * @param size 
 * @param index 
 * @param column 
 */
declare function invertMatrix(A: number[], AI: number[], size: number, index?: number, column?: any): number;

/**
 * 
 * @param A 
 * @param size 
 */
declare function estimateMatrixCondition(A: number[], size: number): number;

/**
 * 
 * @param a_3x3 
 * @param w 
 * @param v 
 */
declare function jacobi(a_3x3: mat3, w: number[], v: number[]): number;

/**
 * 
 * @param numberOfSamples 
 * @param xt 
 * @param xOrder 
 * @param mt 
 */
declare function solveHomogeneousLeastSquares(numberOfSamples: number, xt: number[], xOrder: number, mt: number[]): number;

/**
 * 
 * @param numberOfSamples 
 * @param xt 
 * @param xOrder 
 * @param yt 
 * @param yOrder 
 * @param mt 
 * @param checkHomogeneous 
 */
declare function solveLeastSquares(numberOfSamples: number, xt: number[], xOrder: number, yt: number[], yOrder: number, mt: number[], checkHomogeneous: boolean): number;

/**
 * 
 * @param hexStr 
 * @param outFloatArray 
 */
declare function hex2float(hexStr: string, outFloatArray: number[]): number[];

/**
 * 
 * @param rgb 
 * @param hsv 
 */
declare function rgb2hsv(rgb: number[], hsv: number[]): void;

/**
 * 
 * @param hsv 
 * @param rgb 
 */
declare function hsv2rgb(hsv: number[], rgb: number[]): void;

/**
 * 
 * @param lab 
 * @param xyz 
 */
declare function lab2xyz(lab: number[], xyz: number[]): void;

/**
 * 
 * @param xyz 
 * @param lab 
 */
declare function xyz2lab(xyz: number[], lab: number[]): void;

/**
 * 
 * @param xyz 
 * @param rgb 
 */
declare function xyz2rgb(xyz: number[], rgb: number[]): void;

/**
 * 
 * @param rgb 
 * @param xyz 
 */
declare function rgb2xyz(rgb: number[], xyz: number[]): void;

/**
 * 
 * @param rgb 
 * @param lab 
 */
declare function rgb2lab(rgb: number[], lab: number[]): void;

/**
 * 
 * @param lab 
 * @param rgb 
 */
declare function lab2rgb(lab: number[], rgb: number[]): void;

/**
 * 
 * @param bounds 
 */
declare function uninitializeBounds(bounds: number[]): void;

/**
 * 
 * @param bounds 
 */
declare function areBoundsInitialized(bounds: number[]): boolean;

/**
 * 
 * @param point1 
 * @param point2 
 * @param bounds 
 */
declare function computeBoundsFromPoints(point1: number[], point2: number[], bounds: number[]): void;

/**
 * 
 * @param value 
 * @param minValue 
 * @param maxValue 
 */
declare function clampValue(value: number, minValue: number, maxValue: number): number[];

/**
 * 
 * @param vector 
 * @param minVector 
 * @param maxVector 
 * @param out 
 */
declare function clampVector(vector: number[], minVector: number[], maxVector: number[], out: number[]): number[];

/**
 * 
 * @param vector 
 * @param out 
 */
declare function roundVector(vector: number[], out: number[]): number[];

/**
 * 
 * @param value 
 * @param range 
 */
declare function clampAndNormalizeValue(value: number, range: number[]): number;

/**
 * 
 */
declare function getScalarTypeFittingRange(): void;

/**
 * 
 */
declare function getAdjustedScalarRange(): void;

/**
 * 
 * @param extent1 
 * @param extent2 
 */
declare function extentIsWithinOtherExtent(extent1: number[], extent2: number[]): number;

/**
 * 
 * @param bounds1_6 
 * @param bounds2_6 
 * @param delta_3 
 */
declare function boundsIsWithinOtherBounds(bounds1_6: number[], bounds2_6: number[], delta_3: number[]): number;

/**
 * 
 * @param point_3 
 * @param bounds_6 
 * @param delta_3 
 */
declare function pointIsWithinBounds(point_3: number[], bounds_6: number[], delta_3: number[]): number;

/**
 * 
 * @param p1 
 * @param p2 
 * @param p3 
 * @param center 
 */
declare function solve3PointCircle(p1: number[], p2: number[], p3: number[], center: number[]): number;

/**
 * 
 * @param value 
 */
declare function isInf(value: number): boolean;

/**
 * 
 */
declare function createUninitializedBounds(): number[];

/**
 * 
 * @param vector 
 */
declare function getMajorAxisIndex(vector: number[]): number;

/**
 * 
 * @param value 
 */
declare function floatToHex2(value: number): string;

/**
 * 
 * @param rgbArray 
 * @param prefix 
 */
declare function floatRGB2HexCode(rgbArray: number[], prefix?: string): string;

/**
 * 
 * @param rgbArray 
 */
declare function float2CssRGBA(rgbArray: number[]): string;

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
	roundVector: typeof roundVector;
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
