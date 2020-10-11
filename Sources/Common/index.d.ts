declare function toArrayBuffer(b64Str: any): ArrayBuffer;
export interface T100 {
  toArrayBuffer: typeof toArrayBuffer;
}
declare function extractCellSizes(cellArray: any): any;
declare function getNumberOfCells(cellArray: any): any;
export interface T101 {
  [key: string]: any;
}
declare function extend(publicAPI: any, model: any, initialValues?: T101): void;
export interface T102 {
  extractCellSizes: typeof extractCellSizes;
  getNumberOfCells: typeof getNumberOfCells;
  newInstance: any;
  extend: typeof extend;
}
/**
 * Method use to create a new instance of vtkDataArray
 * @param initialValues for pre-setting some of its content
 */
declare function newInstance(initialValues?: object): VtkDataArray;
/**
 * Method use to decorate a given object (publicAPI+model) with vtkDataArray characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param initialValues (default: {})
 */
declare function extend_1(publicAPI: object, model: object, initialValues?: object): void;
/**
 * Compute range of a given array. The array could be composed of tuples and
 * individual component range could be computed as well as magnitude.
 *
 * ```
 * const array = [x0, y0, z0, x1, y1, z1, ..., xn, yn, zn];
 * const { min: yMin, max: yMax } = computeRange(array, 1, 3);
 * const { min: minMagnitude, max: maxMagnitude } = computeRange(array, -1, 3);
 * ```
 *
 * @param values Array to go through to extract the range from
 * @param component (default: 0) indice to use inside tuple size
 * @param numberOfComponents (default: 1) size of the tuple
 */
declare function computeRange(values: number[], component?: number, numberOfComponents?: number): VtkRange;
/**
 * Create helper object that can be used to gather min, max, count, sum of
 * a set of values.
 */
declare function createRangeHelper(): VtkRangeHelper;
/**
 * Return the name of a typed array
 *
 * ```
 * const isFloat32 = ('Float32Array' === getDataType(array));
 * const clone = new macro.TYPED_ARRAYS[getDataType(array)](array.length);
 * ```
 *
 * @param typedArray to extract its type from
 */
declare function getDataType(typedArray: any): string;
/**
 * Return the max norm of a given vtkDataArray
 *
 * @param dataArray to process
 */
declare function getMaxNorm(dataArray: VtkDataArray_1): number;
export interface T103 {
  newInstance: typeof newInstance;
  extend: typeof extend_1;
  computeRange: typeof computeRange;
  createRangeHelper: typeof createRangeHelper;
  getDataType: typeof getDataType;
  getMaxNorm: typeof getMaxNorm;
  DataTypeByteSize: typeof DataTypeByteSize;
  VtkDataTypes: typeof VtkDataTypes;
  DefaultDataType: VtkDataTypes;
}
declare function getEndianness(): string | string;
declare function swapBytes(buffer: any, wordSize: any): void;
export interface T104 {
  ENDIANNESS: string;
  getEndianness: typeof getEndianness;
  swapBytes: typeof swapBytes;
}
/**
 * Takes a canvas and converts it to a vtkImageData.
 *
 * Optionally supply a bounding box to get a particular subset of the canvas.
 *
 * @param canvas       The HTML canvas to convert
 * @param boundingBox  A bounding box of type [top, left, width, height]
 */
declare function canvasToImageData(canvas: any, boundingBox?: number[]): any;
export interface T105 {
  flipX: boolean;
  flipY: boolean;
  rotate: number;
}
/**
 * Converts an Image object to a vtkImageData.
 */
declare function imageToImageData(image: any, transform?: T105): any;
export interface T106 {
  canvasToImageData: typeof canvasToImageData;
  imageToImageData: typeof imageToImageData;
}
declare function extend_2(publicAPI: any, model: any, initialValues?: T101): void;
export interface T107 {
  newInstance: any;
  extend: typeof extend_2;
}
declare namespace _Math {
  // Sources/Common/Core/Math/index.js
  export function Pi(): number;
  export function radiansFromDegrees_1(deg: any): number;
  export const radiansFromDegrees: typeof radiansFromDegrees_1;
  export function degreesFromRadians_1(rad: any): number;
  export const degreesFromRadians: typeof degreesFromRadians_1;
  export function arrayMin_1(arr: any, offset?: number, stride?: number): number;
  export const arrayMin: typeof arrayMin_1;
  export function arrayMax_1(arr: any, offset?: number, stride?: number): number;
  export const arrayMax: typeof arrayMax_1;
  export function arrayRange_1(arr: any, offset?: number, stride?: number): number[];
  export const arrayRange: typeof arrayRange_1;
  export function ceilLog2(): any;
  export function factorial(): any;
  export function nearestPowerOfTwo_1(xi: any): number;
  export const nearestPowerOfTwo: typeof nearestPowerOfTwo_1;
  export function isPowerOfTwo_1(x: any): boolean;
  export const isPowerOfTwo: typeof isPowerOfTwo_1;
  export function binomial_1(m: any, n: any): number;
  export const binomial: typeof binomial_1;
  export function beginCombination_1(m: any, n: any): number | number[];
  export const beginCombination: typeof beginCombination_1;
  export function nextCombination_1(m: any, n: any, r: any): number;
  export const nextCombination: typeof nextCombination_1;
  export function randomSeed_1(seed: any): void;
  export const randomSeed: typeof randomSeed_1;
  export function getSeed_1(): number;
  export const getSeed: typeof getSeed_1;
  export function random_1(minValue?: number, maxValue?: number): number;
  export const random: typeof random_1;
  export function gaussian(): any;
  export function add_1(a: any, b: any, out: any): any;
  export const add: typeof add_1;
  export function subtract_1(a: any, b: any, out: any): any;
  export const subtract: typeof subtract_1;
  export function multiplyScalar_1(vec: any, scalar: any): any;
  export const multiplyScalar: typeof multiplyScalar_1;
  export function multiplyScalar2D_1(vec: any, scalar: any): any;
  export const multiplyScalar2D: typeof multiplyScalar2D_1;
  export function multiplyAccumulate_1(a: any, b: any, scalar: any, out: any): any;
  export const multiplyAccumulate: typeof multiplyAccumulate_1;
  export function multiplyAccumulate2D_1(a: any, b: any, scalar: any, out: any): any;
  export const multiplyAccumulate2D: typeof multiplyAccumulate2D_1;
  export function dot_1(x: any, y: any): number;
  export const dot: typeof dot_1;
  export function outer_1(x: any, y: any, out_3x3: any): void;
  export const outer: typeof outer_1;
  export function cross_1(x: any, y: any, out: any): any;
  export const cross: typeof cross_1;
  export function norm_1(x: any, n?: number): number;
  export const norm: typeof norm_1;
  export function normalize_1(x: any): number;
  export const normalize: typeof normalize_1;
  export function perpendiculars_1(x: any, y: any, z: any, theta: any): void;
  export const perpendiculars: typeof perpendiculars_1;
  export function projectVector_1(a: any, b: any, projection: any): boolean;
  export const projectVector: typeof projectVector_1;
  export function dot2D_1(x: any, y: any): number;
  export const dot2D: typeof dot2D_1;
  export function projectVector2D_1(a: any, b: any, projection: any): boolean;
  export const projectVector2D: typeof projectVector2D_1;
  export function distance2BetweenPoints_1(x: any, y: any): number;
  export const distance2BetweenPoints: typeof distance2BetweenPoints_1;
  export function angleBetweenVectors_1(v1: any, v2: any): number;
  export const angleBetweenVectors: typeof angleBetweenVectors_1;
  export function gaussianAmplitude_1(mean: any, variance: any, position: any): number;
  export const gaussianAmplitude: typeof gaussianAmplitude_1;
  export function gaussianWeight_1(mean: any, variance: any, position: any): number;
  export const gaussianWeight: typeof gaussianWeight_1;
  export function outer2D_1(x: any, y: any, out_2x2: any): void;
  export const outer2D: typeof outer2D_1;
  export function norm2D_1(x2D: any): number;
  export const norm2D: typeof norm2D_1;
  export function normalize2D_1(x: any): number;
  export const normalize2D: typeof normalize2D_1;
  export function determinant2x2_1(...args: any[]): number;
  export const determinant2x2: typeof determinant2x2_1;
  export function LUFactor3x3_1(mat_3x3: any, index_3: any): void;
  export const LUFactor3x3: typeof LUFactor3x3_1;
  export function LUSolve3x3_1(mat_3x3: any, index_3: any, x_3: any): void;
  export const LUSolve3x3: typeof LUSolve3x3_1;
  export function linearSolve3x3_1(mat_3x3: any, x_3: any, y_3: any): void;
  export const linearSolve3x3: typeof linearSolve3x3_1;
  export function multiply3x3_vect3_1(mat_3x3: any, in_3: any, out_3: any): void;
  export const multiply3x3_vect3: typeof multiply3x3_vect3_1;
  export function multiply3x3_mat3_1(a_3x3: any, b_3x3: any, out_3x3: any): void;
  export const multiply3x3_mat3: typeof multiply3x3_mat3_1;
  export function multiplyMatrix_1(a: any, b: any, rowA: any, colA: any, rowB: any, colB: any, out_rowXcol: any): void;
  export const multiplyMatrix: typeof multiplyMatrix_1;
  export function transpose3x3_1(in_3x3: any, outT_3x3: any): void;
  export const transpose3x3: typeof transpose3x3_1;
  export function invert3x3_1(in_3x3: any, outI_3x3: any): void;
  export const invert3x3: typeof invert3x3_1;
  export function identity3x3_1(mat_3x3: any): void;
  export const identity3x3: typeof identity3x3_1;
  export function determinant3x3_1(mat_3x3: any): number;
  export const determinant3x3: typeof determinant3x3_1;
  export function quaternionToMatrix3x3_1(quat_4: any, mat_3x3: any): void;
  export const quaternionToMatrix3x3: typeof quaternionToMatrix3x3_1;
  export function areMatricesEqual_1(matA: any, matB: any): any;
  export const areMatricesEqual: typeof areMatricesEqual_1;
  export function jacobiN_1(a: any, n: any, w: any, v: any): number | number;
  export const jacobiN: typeof jacobiN_1;
  export function matrix3x3ToQuaternion_1(mat_3x3: any, quat_4: any): void;
  export const matrix3x3ToQuaternion: typeof matrix3x3ToQuaternion_1;
  export function multiplyQuaternion_1(quat_1: any, quat_2: any, quat_out: any): void;
  export const multiplyQuaternion: typeof multiplyQuaternion_1;
  export function orthogonalize3x3_1(a_3x3: any, out_3x3: any): void;
  export const orthogonalize3x3: typeof orthogonalize3x3_1;
  export function diagonalize3x3_1(a_3x3: any, w_3: any, v_3x3: any): void;
  export const diagonalize3x3: typeof diagonalize3x3_1;
  export function singularValueDecomposition3x3_1(a_3x3: any, u_3x3: any, w_3: any, vT_3x3: any): void;
  export const singularValueDecomposition3x3: typeof singularValueDecomposition3x3_1;
  export function luFactorLinearSystem_1(A: any, index: any, size: any): number | number;
  export const luFactorLinearSystem: typeof luFactorLinearSystem_1;
  export function luSolveLinearSystem_1(A: any, index: any, x: any, size: any): void;
  export const luSolveLinearSystem: typeof luSolveLinearSystem_1;
  export function solveLinearSystem_1(A: any, x: any, size: any): number | number;
  export const solveLinearSystem: typeof solveLinearSystem_1;
  export function invertMatrix_1(A: any, AI: any, size: any, index?: any, column?: any): number | number;
  export const invertMatrix: typeof invertMatrix_1;
  export function estimateMatrixCondition_1(A: any, size: any): number;
  export const estimateMatrixCondition: typeof estimateMatrixCondition_1;
  export function jacobi_1(a_3x3: any, w: any, v: any): number | number;
  export const jacobi: typeof jacobi_1;
  export function solveHomogeneousLeastSquares_1(numberOfSamples: any, xt: any, xOrder: any, mt: any): number | number;
  export const solveHomogeneousLeastSquares: typeof solveHomogeneousLeastSquares_1;
  export function solveLeastSquares_1(numberOfSamples: any, xt: any, xOrder: any, yt: any, yOrder: any, mt: any, checkHomogeneous?: boolean): number | number;
  export const solveLeastSquares: typeof solveLeastSquares_1;
  export function hex2float_1(hexStr: any, outFloatArray?: number[]): number[];
  export const hex2float: typeof hex2float_1;
  export function rgb2hsv_1(rgb: any, hsv: any): void;
  export const rgb2hsv: typeof rgb2hsv_1;
  export function hsv2rgb_1(hsv: any, rgb: any): void;
  export const hsv2rgb: typeof hsv2rgb_1;
  export function lab2xyz_1(lab: any, xyz: any): void;
  export const lab2xyz: typeof lab2xyz_1;
  export function xyz2lab_1(xyz: any, lab: any): void;
  export const xyz2lab: typeof xyz2lab_1;
  export function xyz2rgb_1(xyz: any, rgb: any): void;
  export const xyz2rgb: typeof xyz2rgb_1;
  export function rgb2xyz_1(rgb: any, xyz: any): void;
  export const rgb2xyz: typeof rgb2xyz_1;
  export function rgb2lab_1(rgb: any, lab: any): void;
  export const rgb2lab: typeof rgb2lab_1;
  export function lab2rgb_1(lab: any, rgb: any): void;
  export const lab2rgb: typeof lab2rgb_1;
  export function uninitializeBounds_1(bounds: any): void;
  export const uninitializeBounds: typeof uninitializeBounds_1;
  export function areBoundsInitialized_1(bounds: any): boolean;
  export const areBoundsInitialized: typeof areBoundsInitialized_1;
  export function computeBoundsFromPoints_1(point1: any, point2: any, bounds: any): void;
  export const computeBoundsFromPoints: typeof computeBoundsFromPoints_1;
  export function clampValue_1(value: any, minValue: any, maxValue: any): any;
  export const clampValue: typeof clampValue_1;
  export function clampVector_1(vector: any, minVector: any, maxVector: any, out?: any[]): any[];
  export const clampVector: typeof clampVector_1;
  export function roundVector_1(vector: any, out?: any[]): any[];
  export const roundVector: typeof roundVector_1;
  export function clampAndNormalizeValue_1(value: any, range: any): number;
  export const clampAndNormalizeValue: typeof clampAndNormalizeValue_1;
  export function getScalarTypeFittingRange(): any;
  export function getAdjustedScalarRange(): any;
  export function extentIsWithinOtherExtent_1(extent1: any, extent2: any): number | number;
  export const extentIsWithinOtherExtent: typeof extentIsWithinOtherExtent_1;
  export function boundsIsWithinOtherBounds_1(bounds1_6: any, bounds2_6: any, delta_3: any): number | number;
  export const boundsIsWithinOtherBounds: typeof boundsIsWithinOtherBounds_1;
  export function pointIsWithinBounds_1(point_3: any, bounds_6: any, delta_3: any): number | number;
  export const pointIsWithinBounds: typeof pointIsWithinBounds_1;
  export function solve3PointCircle_1(p1: any, p2: any, p3: any, center: any): number;
  export const solve3PointCircle: typeof solve3PointCircle_1;
  export const inf: number;
  export const negInf: number;
  export function isInf(value: any): boolean;
  export function isNan(number: any): boolean;
  export function createUninitializedBounds_1(): any[];
  export const createUninitializedBounds: typeof createUninitializedBounds_1;
  export function getMajorAxisIndex_1(vector: any): number;
  export const getMajorAxisIndex: typeof getMajorAxisIndex_1;
  export function floatToHex2_1(value: any): string;
  export const floatToHex2: typeof floatToHex2_1;
  export function floatRGB2HexCode_1(rgbArray: any, prefix?: string): string;
  export const floatRGB2HexCode: typeof floatRGB2HexCode_1;
  export function float2CssRGBA_1(rgbArray: any): string;
  export const float2CssRGBA: typeof float2CssRGBA_1;
  export function rotateVector_1(vectorToBeRotated: any, axis: any, angle: any): number[];
  export const rotateVector: typeof rotateVector_1;
  export interface T108 {
    Pi: () => number;
    radiansFromDegrees: typeof radiansFromDegrees_1;
    degreesFromRadians: typeof degreesFromRadians_1;
    round: (x: number) => number;
    floor: (x: number) => number;
    ceil: (x: number) => number;
    ceilLog2: () => any;
    min: (...values: number[]) => number;
    max: (...values: number[]) => number;
    arrayMin: typeof arrayMin_1;
    arrayMax: typeof arrayMax_1;
    arrayRange: typeof arrayRange_1;
    isPowerOfTwo: typeof isPowerOfTwo_1;
    nearestPowerOfTwo: typeof nearestPowerOfTwo_1;
    factorial: () => any;
    binomial: typeof binomial_1;
    beginCombination: typeof beginCombination_1;
    nextCombination: typeof nextCombination_1;
    randomSeed: typeof randomSeed_1;
    getSeed: typeof getSeed_1;
    random: typeof random_1;
    gaussian: () => any;
    add: typeof add_1;
    subtract: typeof subtract_1;
    multiplyScalar: typeof multiplyScalar_1;
    multiplyScalar2D: typeof multiplyScalar2D_1;
    multiplyAccumulate: typeof multiplyAccumulate_1;
    multiplyAccumulate2D: typeof multiplyAccumulate2D_1;
    dot: typeof dot_1;
    outer: typeof outer_1;
    cross: typeof cross_1;
    norm: typeof norm_1;
    normalize: typeof normalize_1;
    perpendiculars: typeof perpendiculars_1;
    projectVector: typeof projectVector_1;
    projectVector2D: typeof projectVector2D_1;
    distance2BetweenPoints: typeof distance2BetweenPoints_1;
    angleBetweenVectors: typeof angleBetweenVectors_1;
    gaussianAmplitude: typeof gaussianAmplitude_1;
    gaussianWeight: typeof gaussianWeight_1;
    dot2D: typeof dot2D_1;
    outer2D: typeof outer2D_1;
    norm2D: typeof norm2D_1;
    normalize2D: typeof normalize2D_1;
    determinant2x2: typeof determinant2x2_1;
    LUFactor3x3: typeof LUFactor3x3_1;
    LUSolve3x3: typeof LUSolve3x3_1;
    linearSolve3x3: typeof linearSolve3x3_1;
    multiply3x3_vect3: typeof multiply3x3_vect3_1;
    multiply3x3_mat3: typeof multiply3x3_mat3_1;
    multiplyMatrix: typeof multiplyMatrix_1;
    transpose3x3: typeof transpose3x3_1;
    invert3x3: typeof invert3x3_1;
    identity3x3: typeof identity3x3_1;
    determinant3x3: typeof determinant3x3_1;
    quaternionToMatrix3x3: typeof quaternionToMatrix3x3_1;
    areMatricesEqual: typeof areMatricesEqual_1;
    matrix3x3ToQuaternion: typeof matrix3x3ToQuaternion_1;
    multiplyQuaternion: typeof multiplyQuaternion_1;
    orthogonalize3x3: typeof orthogonalize3x3_1;
    diagonalize3x3: typeof diagonalize3x3_1;
    singularValueDecomposition3x3: typeof singularValueDecomposition3x3_1;
    solveLinearSystem: typeof solveLinearSystem_1;
    invertMatrix: typeof invertMatrix_1;
    luFactorLinearSystem: typeof luFactorLinearSystem_1;
    luSolveLinearSystem: typeof luSolveLinearSystem_1;
    estimateMatrixCondition: typeof estimateMatrixCondition_1;
    jacobi: typeof jacobi_1;
    jacobiN: typeof jacobiN_1;
    solveHomogeneousLeastSquares: typeof solveHomogeneousLeastSquares_1;
    solveLeastSquares: typeof solveLeastSquares_1;
    hex2float: typeof hex2float_1;
    rgb2hsv: typeof rgb2hsv_1;
    hsv2rgb: typeof hsv2rgb_1;
    lab2xyz: typeof lab2xyz_1;
    xyz2lab: typeof xyz2lab_1;
    xyz2rgb: typeof xyz2rgb_1;
    rgb2xyz: typeof rgb2xyz_1;
    rgb2lab: typeof rgb2lab_1;
    lab2rgb: typeof lab2rgb_1;
    uninitializeBounds: typeof uninitializeBounds_1;
    areBoundsInitialized: typeof areBoundsInitialized_1;
    computeBoundsFromPoints: typeof computeBoundsFromPoints_1;
    clampValue: typeof clampValue_1;
    clampVector: typeof clampVector_1;
    clampAndNormalizeValue: typeof clampAndNormalizeValue_1;
    getScalarTypeFittingRange: () => any;
    getAdjustedScalarRange: () => any;
    extentIsWithinOtherExtent: typeof extentIsWithinOtherExtent_1;
    boundsIsWithinOtherBounds: typeof boundsIsWithinOtherBounds_1;
    pointIsWithinBounds: typeof pointIsWithinBounds_1;
    solve3PointCircle: typeof solve3PointCircle_1;
    inf: number;
    negInf: number;
    isInf: (value: any) => boolean;
    isNan: (number: any) => boolean;
    isNaN: (number: any) => boolean;
    isFinite: (number: any) => boolean;
    createUninitializedBounds: typeof createUninitializedBounds_1;
    getMajorAxisIndex: typeof getMajorAxisIndex_1;
    floatToHex2: typeof floatToHex2_1;
    floatRGB2HexCode: typeof floatRGB2HexCode_1;
    float2CssRGBA: typeof float2CssRGBA_1;
    rotateVector: typeof rotateVector_1;
  }
  export const T109: T108;
}
declare class Transform {
  matrix: Float64Array;
  tmp: Float64Array;
  angleConv(v: any): any;
  constructor(useDegree?: boolean);
  rotateFromDirections(originDirection: any, targetDirection: any): this;
  rotate(angle: any, axis: any): this;
  rotateX(angle: any): this;
  rotateY(angle: any): this;
  rotateZ(angle: any): this;
  translate(x: any, y: any, z: any): this;
  scale(sx: any, sy: any, sz: any): this;
  identity(): this;
  apply(typedArray: any, offset?: number, nbIterations?: number): this;
  getMatrix(): Float64Array;
  setMatrix(mat4x4: any): this;
}
declare function buildFromDegree(): Transform;
declare function buildFromRadian(): Transform;
export interface T108 {
  buildFromDegree: typeof buildFromDegree;
  buildFromRadian: typeof buildFromRadian;
}
declare function extend_3(publicAPI: any, model: any, initialValues?: T101): void;
export interface T109 {
  newInstance: any;
  extend: typeof extend_3;
}
declare function extend_4(publicAPI: any, model: any, initialValues?: T101): void;
export interface T110 {
  newInstance: any;
  extend: typeof extend_4;
}
declare function extend_5(publicAPI: any, model: any, initialValues?: T101): void;
export interface T111 {
  newInstance: any;
  extend: typeof extend_5;
}
declare function toNativeType(str: any): any;
declare function extractURLParameters(castToNativeType?: boolean, query?: string): T101;
export interface T112 {
  toNativeType: typeof toNativeType;
  extractURLParameters: typeof extractURLParameters;
}
declare function extend_6(publicAPI: any, model: any, initialValues?: T101): void;
export interface T113 {
  newInstance: any;
  extend: typeof extend_6;
}
export interface T114 {
  vtkBase64: T100;
  vtkCellArray: T102;
  vtkDataArray: T103;
  vtkEndian: T104;
  vtkImageHelper: T106;
  vtkLookupTable: T107;
  vtkMath: typeof _Math;
  vtkMatrixBuilder: T108;
  vtkPoints: T109;
  vtkProgressHandler: T110;
  vtkScalarsToColors: any;
  vtkStringArray: T111;
  vtkURLExtract: T112;
  vtkVariantArray: T113;
}
declare function isValid(bounds: any): boolean;
declare function getCenter(bounds: any): number[];
declare function getLength(bounds: any, index: any): number;
declare function getLengths(bounds: any): number[];
declare function getMaxLength(bounds: any): number;
declare function getDiagonalLength(bounds: any): number;
declare function getXRange(bounds: any): any;
declare function getYRange(bounds: any): any;
declare function getZRange(bounds: any): any;
declare function getCorners(bounds: any, corners: any): void;
declare function computeCornerPoints(point1: any, point2: any, bounds: any): void;
declare function computeScale3(bounds: any, scale3?: any[]): any[];
declare function extend_7(publicAPI: any, model: any, initialValues?: T101): void;
export interface T115 {
  isValid: typeof isValid;
  getCenter: typeof getCenter;
  getLength: typeof getLength;
  getLengths: typeof getLengths;
  getMaxLength: typeof getMaxLength;
  getDiagonalLength: typeof getDiagonalLength;
  getXRange: typeof getXRange;
  getYRange: typeof getYRange;
  getZRange: typeof getZRange;
  getCorners: typeof getCorners;
  computeCornerPoints: typeof computeCornerPoints;
  computeScale3: typeof computeScale3;
  INIT_BOUNDS: number[];
  newInstance: any;
  extend: typeof extend_7;
}
declare function intersectBox(bounds: any, origin: any, dir: any, coord: any, tolerance: any): number | number;
declare function intersectPlane(bounds: any, origin: any, normal: any): number | number;
declare function extend_8(publicAPI: any, model: any, initialValues?: T101): void;
export interface T116 {
  intersectBox: typeof intersectBox;
  intersectPlane: typeof intersectPlane;
  newInstance: any;
  extend: typeof extend_8;
}
declare function extend_9(publicAPI: any, model: any, initialValues?: T101): void;
export interface T117 {
  newInstance: any;
  extend: typeof extend_9;
}
declare function extend_10(publicAPI: any, model: any, initialValues?: T101): void;
export interface T118 {
  newInstance: any;
  extend: typeof extend_10;
}
declare function evaluate(radius: any, center: any, axis: any, x: any): number;
declare function extend_11(publicAPI: any, model: any, initialValues?: T101): void;
export interface T119 {
  evaluate: typeof evaluate;
  newInstance: any;
  extend: typeof extend_11;
}
/**
 * Converts an itk.js image to a vtk.js image.
 *
 * Requires an itk.js image as input.
 */
declare function convertItkToVtkImage(itkImage: any, options?: T101): any;
export interface T120 {
  dimension: number;
  pixelType: number;
  componentType: string;
  components: number;
}
export interface T121 {
  data: number[];
}
export interface T122 {
  imageType: T120;
  name: string;
  origin: any;
  spacing: any;
  direction: T121;
  size: any;
}
/**
 * Converts a vtk.js image to an itk.js image.
 *
 * Requires a vtk.js image as input.
 */
declare function convertVtkToItkImage(vtkImage: any, copyData?: boolean): T122;
export interface T123 {
  convertItkToVtkImage: typeof convertItkToVtkImage;
  convertVtkToItkImage: typeof convertVtkToItkImage;
}
declare function extend_12(publicAPI: any, model: any, initialValues?: T101): void;
export interface T124 {
  newInstance: any;
  extend: typeof extend_12;
}
declare function extend_13(publicAPI: any, model: any, initialValues?: T101): void;
export interface T125 {
  newInstance: any;
  extend: typeof extend_13;
}
declare function extend_14(publicAPI: any, model: any, initialValues?: T101): void;
export interface T126 {
  newInstance: any;
  extend: typeof extend_14;
}
declare function evaluate_1(normal: any, origin: any, x: any): number;
declare function distanceToPlane(x: any, origin: any, normal: any): number;
declare function projectPoint(x: any, origin: any, normal: any, xproj: any): void;
declare function projectVector_2(v: any, normal: any, vproj: any): void;
declare function generalizedProjectPoint(x: any, origin: any, normal: any, xproj: any): void;
export interface T127 {
  intersection: boolean;
  betweenPoints: boolean;
  t: number;
  x: any[];
}
declare function intersectWithLine(p1: any, p2: any, origin: any, normal: any): T127;
export interface T128 {
  intersection: boolean;
  l0: any[];
  l1: any[];
  error: any;
}
declare function intersectWithPlane(plane1Origin: any, plane1Normal: any, plane2Origin: any, plane2Normal: any): T128;
declare function extend_15(publicAPI: any, model: any, initialValues?: T101): void;
export interface T129 {
  evaluate: typeof evaluate_1;
  distanceToPlane: typeof distanceToPlane;
  projectPoint: typeof projectPoint;
  projectVector: typeof projectVector_2;
  generalizedProjectPoint: typeof generalizedProjectPoint;
  intersectWithLine: typeof intersectWithLine;
  intersectWithPlane: typeof intersectWithPlane;
  DISJOINT: string;
  COINCIDE: string;
  newInstance: any;
  extend: typeof extend_15;
}
declare function extend_16(publicAPI: any, model: any, initialValues?: T101): void;
export interface T130 {
  newInstance: any;
  extend: typeof extend_16;
}
declare function extend_17(publicAPI: any, model: any, initialValues?: T101): void;
export interface T131 {
  newInstance: any;
  extend: typeof extend_17;
}
declare function evaluate_2(radius: any, center: any, x: any): number;
declare function isPointIn3DEllipse(point: any, bounds: any): boolean;
declare function extend_18(publicAPI: any, model: any, initialValues?: T101): void;
export interface T132 {
  evaluate: typeof evaluate_2;
  isPointIn3DEllipse: typeof isPointIn3DEllipse;
  newInstance: any;
  extend: typeof extend_18;
}
declare function computeNormalDirection(v1: any, v2: any, v3: any, n: any): void;
declare function computeNormal(v1: any, v2: any, v3: any, n: any): void;
declare function extend_19(publicAPI: any, model: any, initialValues?: T101): void;
export interface T133 {
  computeNormalDirection: typeof computeNormalDirection;
  computeNormal: typeof computeNormal;
  newInstance: any;
  extend: typeof extend_19;
}
export interface T134 {
  vtkBoundingBox: T115;
  vtkBox: T116;
  vtkCell: T117;
  vtkCone: T118;
  vtkCylinder: T119;
  vtkDataSet: any;
  vtkDataSetAttributes: any;
  vtkITKHelper: T123;
  vtkImageData: T124;
  vtkImplicitBoolean: any;
  vtkLine: any;
  vtkMolecule: T125;
  vtkPiecewiseFunction: T126;
  vtkPlane: T129;
  vtkPointSet: T130;
  vtkPolyData: T131;
  vtkSelectionNode: any;
  vtkSphere: T132;
  vtkStructuredData: any;
  vtkTriangle: T133;
}
export interface T135 {
  vtkLandmarkTransform: any;
}
export interface T136 {
  width: number;
  height: number;
}
declare function getVRHeadset(): Promise<any>;
export interface T137 {
  isMobile: boolean;
  isIOS: boolean;
  isWebViewAndroid: boolean;
  isSafari: boolean;
  isFirefoxAndroid: boolean;
  hardware: T136;
  getVRHeadset: typeof getVRHeadset;
}
declare function getUniversalTime(): number;
export interface T138 {
  getUniversalTime: typeof getUniversalTime;
}
export interface T139 {
  vtkMobileVR: T137;
  vtkTimerLog: T138;
}
export interface T140 {
  Core: T114;
  DataModel: T134;
  Transform: T135;
  System: T139;
}
declare const T141: T140;
export default T141;
