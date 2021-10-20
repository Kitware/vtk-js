import { mat2, mat3, vec2, vec3, vec4 } from "gl-matrix";

/**
 *
 * @param {Number} size The size of the array.
 */
export function createArray(size?: number): number[];

/**
 * Get the number π.
 */
export function Pi(): number;

/**
 * Convert degrees to radians.
 * @param {Number} deg The value in degrees.
 */
export function radiansFromDegrees(deg: number): number;

/**
 * Convert radians to degrees.
 * @param {Number} rad The value in radians.
 */
export function degreesFromRadians(rad: number): number;

/**
 * Same as Math.round().
 * @param {Number} param1 A number.
 */
export function round(param1: number): number;

/**
 * Same as Math.floor().
 * @param {Number} param1 A number.
 */
export function floor(param1: number): number;

/**
 * Same as Math.ceil().
 * @param {Number} param1 A number.
 */
export function ceil(param1: number): number;

/**
 * Get the minimum of the two arguments provided. If either argument is NaN,
 * the first argument will always be returned.
 * @param {Number} param1 The first number.
 * @param {Number} param2 The second number.
 */
export function min(param1: number, param2: number): number;

/**
 * Get the maximum of the two arguments provided. If either argument is NaN,
 * the first argument will always be returned.
 * @param {Number} param1 
 * @param {Number} param2 
 */
export function max(param1: number, param2: number): number;

/**
 * Get the minimum of the array.
 * @param {Number[]} arr 
 * @param {Number} offset 
 * @param {Number} stride 
 */
export function arrayMin(arr: number[], offset: number, stride: number): number;

/**
 * Get the maximum of the array.
 * @param {Number[]} arr 
 * @param {Number} offset 
 * @param {Number} stride 
 */
export function arrayMax(arr: number[], offset: number, stride: number): number;

/**
 *
 * @param {Number[]} arr 
 * @param {Number} offset 
 * @param {Number} stride 
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
 * @param {Number} xi 
 */
export function nearestPowerOfTwo(xi: number): number;

/**
 * Returns true if integer is a power of two.
 * @param {Number} x 
 */
export function isPowerOfTwo(x: number): boolean;

/**
 * The number of combinations of n objects from a pool of m objects (m>n).
 * @param {Number} m 
 * @param {Number} n 
 */
export function binomial(m: number, n: number): number;

/**
 * Start iterating over "m choose n" objects.
 * @param {Number} [m] 
 * @param {Number} [n] 
 */
export function beginCombination(m?: number, n?: number): number;

/**
 * Given m, n, and a valid combination of n integers in the range [0,m[, this
 * function alters the integers into the next combination in a sequence of all
 * combinations of n items from a pool of m.
 * @param {Number} m 
 * @param {Number} n 
 * @param {Number[]} r 
 */
export function nextCombination(m: number, n: number, r: number[]): number;

/**
 * Initialize seed value.
 * @param {Number} seed 
 */
export function randomSeed(seed: number): void;

/**
 * Return the current seed used by the random number generator.
 */
export function getSeed(): number;

/**
 * Generate pseudo-random numbers distributed according to the uniform
 * distribution between min and max.
 * @param {Number} minValue 
 * @param {Number} maxValue 
 */
export function random(minValue: number, maxValue: number): number;

/**
 * Addition of two 3-vectors (float version).
 * @param {vec3} a
 * @param {vec3} b
 * @param {vec3} out
 * @example
 * ```js
 * a[3] + b[3] => out[3]
 * ```
 */
export function add(a: vec3, b: vec3, out: vec3): vec3;

/**
 *
 * @param {vec3} a
 * @param {vec3} b
 * @param {vec3} out
 * @example
 * ```js
 * a[3] - b[3] => out[3]
 * ```
 */
export function subtract(a: vec3, b: vec3, out: vec3): vec3;

/**
 *
 * @param {vec3} vec 
 * @param {Number} scalar 
 * @example
 * ```js
 * vec[3] * scalar => vec[3]
 * ```
 */
export function multiplyScalar(vec: vec3, scalar: number): vec3;

/**
 *
 * @param {vec2} vec 
 * @param {Number} scalar 
 * @example
 * ```js
 * vec[3] * scalar => vec[3]
 * ```
 */
export function multiplyScalar2D(vec: vec2, scalar: number): vec2;

/**
 *
 * @param {vec3} a
 * @param {vec3} b
 * @param {Number} scalar 
 * @param {vec3} out
 * @example
 * ```js
 * a[3] +  b[3] * scalar => out[3]
 * ```
 */
export function multiplyAccumulate(a: vec3, b: vec3, scalar: number, out: vec3): vec3;

/**
 *
 * @param {vec2} a
 * @param {vec2} b
 * @param {Number} scalar 
 * @param {vec2} out
 * @example
 * ```js
 * a[2] + b[2] * scalar => out[2]
 * ```
 */
export function multiplyAccumulate2D(a: vec2, b: vec2, scalar: number, out: vec2): vec2;

/**
 *
 * @param {vec3} x
 * @param {vec3} y
 * @example
 * ```js
 * a[2] + b[2] * scalar => out[2]
 * ```
 */
export function dot(x: vec3, y: vec3): number;

/**
 *
 * @param {vec3} x
 * @param {vec3} y
 * @param {mat3} out_3x3 
 */
export function outer(x: vec3, y: vec3, out_3x3: mat3): void;

/**
 * Computes cross product of 3D vectors x and y.
 * Returns out.
 * It is safe to x or y as out.
 * @param {vec3} x
 * @param {vec3} y
 * @param {vec3} out
 */
export function cross(x: vec3, y: vec3, out: vec3): vec3;

/**
 *
 * @param {Number[]} x 
 * @param {Number} n 
 */
export function norm(x: number[], n: number): number;

/**
 * Normalize in place. Returns norm.
 * @param {vec3} x
 */
export function normalize(x: vec3): number;

/**
 *
 * @param {vec3} x
 * @param {vec3} y
 * @param {vec3} z
 * @param {Number} theta 
 */
export function perpendiculars(x: vec3, y: vec3, z: vec3, theta: number): void;

/**
 *
 * @param {vec3} a
 * @param {vec3} b
 * @param {vec3} projection
 */
export function projectVector(a: vec3, b: vec3, projection: vec3): boolean;

/**
 *
 * @param {vec2} x
 * @param {vec2} y
 */
export function dot2D(x: vec2, y: vec2): number;

/**
 *
 * @param {vec2} a
 * @param {vec2} b
 * @param projection 
 */
export function projectVector2D(a: vec2, b: vec2, projection: vec2): boolean;

/**
 *
 * @param {vec3} x
 * @param {vec3} y
 */
export function distance2BetweenPoints(x: vec3, y: vec3): number;

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
 * @param {Number} mean 
 * @param {Number} variance 
 * @param {Number} position 
 */
export function gaussianAmplitude(mean: number, variance: number, position: number): number;

/**
 *
 * @param {Number} mean 
 * @param {Number} variance 
 * @param {Number} position 
 */
export function gaussianWeight(mean: number, variance: number, position: number): number;

/**
 *
 * @param {vec2} x
 * @param {vec2} y
 * @param {mat2} out_2x2
 */
export function outer2D(x: vec2, y: vec2, out_2x2: mat2): void;

/**
 *
 * @param {vec2} x2D
 */
export function norm2D(x2D: vec2): number;

/**
 *
 * @param {vec2} x
 */
export function normalize2D(x: vec2): number;

/**
 *
 * @param {Number[]} args 
 */
export function determinant2x2(args: number[]): number;

/**
 *
 * @param {mat3} mat_3x3 
 * @param {vec3} index_3
 */
export function LUFactor3x3(mat_3x3: mat3, index_3: vec3): void;

/**
 *
 * @param {mat3} mat_3x3 
 * @param {vec3} index_3
 * @param {vec3} x_3
 */
export function LUSolve3x3(mat_3x3: mat3, index_3: vec3, x_3: vec3): void;

/**
 *
 * @param {mat3} mat_3x3 
 * @param {vec3} x_3
 * @param {vec3} y_3
 */
export function linearSolve3x3(mat_3x3: mat3, x_3: vec3, y_3: vec3): void;

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
 * @param {Number[]} a 
 * @param {Number[]} b 
 * @param {Number} rowA 
 * @param {Number} colA 
 * @param {Number} rowB 
 * @param {Number} colB 
 * @param {Number[]} out_rowXcol 
 */
export function multiplyMatrix(a: number[], b: number[], rowA: number, colA: number, rowB: number, colB: number, out_rowXcol: number[]): void;

/**
 *
 * @param {mat3} in_3x3 
 * @param {mat3} outT_3x3
 */
export function transpose3x3(in_3x3: mat3, outT_3x3: mat3): void;

/**
 *
 * @param {mat3} in_3x3 
 * @param {mat3} outI_3x3
 */
export function invert3x3(in_3x3: mat3, outI_3x3: mat3): void;

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
 * @param {vec4} quat_4
 * @param {mat3} mat_3x3 
 */
export function quaternionToMatrix3x3(quat_4: vec4, mat_3x3: mat3): void;

/**
 *
 * @param {Number[]} a 
 * @param {Number[]} b 
 * @param {Number} eps 
 */
export function areEquals(a: number[], b: number[], eps: number): boolean;

/**
 *
 * @param {Number} num 
 * @param {Number} [digits] 
 */
export function roundNumber(num: number, digits?: number): number;

/**
 *
 * @param {vec3} vector 
 * @param {vec3} [out]
 * @param {Number} [digits] 
 */
export function roundVector(vector: vec3, out?: vec3, digits?: number): vec3;

/**
 *
 * @param {Number[]} a 
 * @param {Number} n 
 * @param {Number[]} w 
 * @param {Number[]} v 
 */
export function jacobiN(a: number[], n: number, w: number[], v: number[]): number;

/**
 *
 * @param {mat3} mat_3x3 
 * @param {vec4} quat_4
 */
export function matrix3x3ToQuaternion(mat_3x3: mat3, quat_4: vec4): void;

/**
 *
 * @param {vec4} quat_1
 * @param {vec4} quat_2
 * @param {vec4} quat_out
 */
export function multiplyQuaternion(quat_1: vec4, quat_2: vec4, quat_out: vec4): void;

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
 * @param {Number[]} A 
 * @param {Number[]} index 
 * @param {Number} size 
 */
export function luFactorLinearSystem(A: number[], index: number[], size: number): number;

/**
 *
 * @param {Number[]} A 
 * @param {Number[]} index 
 * @param {Number[]} x 
 * @param {Number} size 
 */
export function luSolveLinearSystem(A: number[], index: number[], x: number[], size: number): void;

/**
 *
 * @param {Number[]} A 
 * @param {Number[]} x 
 * @param {Number} size 
 */
export function solveLinearSystem(A: number[], x: number[], size: number): number;

/**
 *
 * @param {Number[]} A 
 * @param {Number[]} AI 
 * @param {Number} size 
 * @param {?} [index] 
 * @param {?} [column] 
 */
export function invertMatrix(A: number[], AI: number[], size: number, index?: any, column?: any): number;

/**
 *
 * @param {Number[]} A 
 * @param {Number} size 
 */
export function estimateMatrixCondition(A: number[], size: number): number;

/**
 *
 * @param {mat3} a_3x3 
 * @param {Number[]} w 
 * @param {Number[]} v 
 */
export function jacobi(a_3x3: mat3, w: number[], v: number[]): number;

/**
 *
 * @param {Number} numberOfSamples 
 * @param {Number[]} xt 
 * @param {Number} xOrder 
 * @param {Number[]} mt 
 */
export function solveHomogeneousLeastSquares(numberOfSamples: number, xt: number[], xOrder: number, mt: number[]): number;

/**
 *
 * @param {Number} numberOfSamples 
 * @param {Number[]} xt 
 * @param {Number} xOrder 
 * @param {Number[]} yt 
 * @param {Number} yOrder 
 * @param {Number[]} mt 
 * @param {Boolean} checkHomogeneous 
 */
export function solveLeastSquares(numberOfSamples: number, xt: number[], xOrder: number, yt: number[], yOrder: number, mt: number[], checkHomogeneous: boolean): number;

/**
 *
 * @param {String} hexStr 
 * @param {Number[]} outFloatArray 
 */
export function hex2float(hexStr: string, outFloatArray: number[]): number[];

/**
 *
 * @param {vec3} rgb An Array of the RGB color.
 * @param {vec3} hsv An Array of the HSV color.
 */
export function rgb2hsv(rgb: vec3, hsv: vec3): void;

/**
 *
 * @param {vec3} hsv An Array of the HSV color.
 * @param {vec3} rgb An Array of the RGB color.
 */
export function hsv2rgb(hsv: vec3, rgb: vec3): void;

/**
 *
 * @param {vec3} lab
 * @param {vec3} xyz
 */
export function lab2xyz(lab: vec3, xyz: vec3): void;

/**
 *
 * @param {vec3} xyz
 * @param {vec3} lab
 */
export function xyz2lab(xyz: vec3, lab: vec3): void;

/**
 *
 * @param {vec3} xyz
 * @param {vec3} rgb An Array of the RGB color.
 */
export function xyz2rgb(xyz: vec3, rgb: vec3): void;

/**
 *
 * @param {vec3} rgb An Array of the RGB color.
 * @param {vec3} xyz
 */
export function rgb2xyz(rgb: vec3, xyz: vec3): void;

/**
 *
 * @param {vec3} rgb
 * @param {vec3} lab
 */
export function rgb2lab(rgb: vec3, lab: vec3): void;

/**
 *
 * @param {vec3} lab
 * @param {vec3} rgb An Array of the RGB color.
 */
export function lab2rgb(lab: vec3, rgb: vec3): void;

/**
 * Returns bounds.
 * @param {Number[]} bounds Output array that hold bounds, optionally empty.
 */
export function uninitializeBounds(bounds: number[]): number[];

/**
 *
 * @param {vec2} bounds
 */
export function areBoundsInitialized(bounds: vec2): boolean;

/**
 * Returns bounds.
 * @param {vec3} point1
 * @param {vec3} point2
 * @param {Number[]} bounds Output array that hold bounds, optionally empty.
 */
export function computeBoundsFromPoints(point1: vec3, point2: vec3, bounds: number[]): number[];

/**
 *
 * @param {Number} value 
 * @param {Number} minValue 
 * @param {Number} maxValue 
 */
export function clampValue(value: number, minValue: number, maxValue: number): number;

/**
 *
 * @param {vec3} vector
 * @param {vec3} minVector
 * @param {vec3} maxVector
 * @param {vec3} out
 */
export function clampVector(vector: vec3, minVector: vec3, maxVector: vec3, out: vec3): vec3;

/**
 *
 * @param {vec3} vector
 * @param {vec3} out
 */
export function roundVector(vector: vec3, out: vec3): vec3;

/**
 *
 * @param {Number} value 
 * @param {vec2} range
 */
export function clampAndNormalizeValue(value: number, range: vec2): number;

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
 * @param {Number[]} extent1 
 * @param {Number[]} extent2 
 */
export function extentIsWithinOtherExtent(extent1: number[], extent2: number[]): number;

/**
 *
 * @param {Number[]} bounds1_6 
 * @param {Number[]} bounds2_6 
 * @param {vec3} delta_3
 */
export function boundsIsWithinOtherBounds(bounds1_6: number[], bounds2_6: number[], delta_3: vec3): number;

/**
 *
 * @param {vec3} point_3
 * @param {Number[]} bounds_6 
 * @param {vec3} delta_3
 */
export function pointIsWithinBounds(point_3: vec3, bounds_6: number[], delta_3: vec3): number;

/**
 *
 * @param {vec3} p1
 * @param {vec3} p2
 * @param {vec3} p3
 * @param {vec3} center
 */
export function solve3PointCircle(p1: vec3, p2: vec3, p3: vec3, center: vec3): number;
 
/**
 * Determines whether the passed value is a infinite number.
 * @param {Number} value 
 */
export function isInf(value: number): boolean;

/**
 *
 */
export function createUninitializedBounds(): number[];

/**
 *
 * @param {Number[]} vector 
 */
export function getMajorAxisIndex(vector: number[]): number;

/**
 *
 * @param {Number} value 
 */
export function floatToHex2(value: number): string;

/**
 *
 * @param {Number[]} rgbArray 
 * @param {string} [prefix] 
 */
export function floatRGB2HexCode(rgbArray: number[], prefix?: string): string;

/**
 *
 * @param {Number[]} rgbArray 
 */
export function float2CssRGBA(rgbArray: number[]): string;

/**
 * Determines whether the passed value is a NaN.
 * @param {Number} value 
 */
export function isNan(value: number): boolean;

/**
 * Determines whether the passed value is a NaN.
 * @param {Number} value 
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
