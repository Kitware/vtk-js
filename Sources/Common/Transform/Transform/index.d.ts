import { mat4, vec3 } from 'gl-matrix';
import { vtkObject } from '../../../interfaces';
import { TypedArray } from '../../../types';

export interface ITransformInitialValues { 
	preMultiplyFlag?: boolean;
	matrix?: number[];
}

type TSlicableArray = number[] | TypedArray;


export interface vtkTransform extends vtkObject {

	/**
	 * Mat4 matrix, used by vtkTransform to transform points, vertices, matrices...
	 * Default is identity.
	 */
	getMatrix(): mat4;

	/**
	 * @see getMatrix
	 * @param {mat4} matrix
	 */
	setMatrix(matrix: mat4): boolean;

	/**
	 * @see getMatrix
	 * Matrix is stored using gl-matrix conventions: column major
	 * @param e00
	 * @param e01
	 * @param e02
	 * @param e03
	 * @param e10
	 * @param e11
	 * @param e12
	 * @param e13
	 * @param e20
	 * @param e21
	 * @param e22
	 * @param e23
	 * @param e30
	 * @param e31
	 * @param e32
	 * @param e33
	 */
	setMatrix(e00: number, e01: number, e02: number, e03: number, e10: number, e11: number, e12: number, e13: number, e20: number, e21: number, e22: number, e23: number, e30: number, e31: number, e32: number, e33: number): boolean;

	/**
	 * The value of preMultiplyFlag indicates how matrix multiplications should occur.
	 * 
	 * When in premultiply mode:
	 * All subsequent operations will occur before those already represented in the current transformation.
	 * In homogeneous matrix notation, M = M*A where M is the current transformation matrix and A is the applied matrix.
	 *
	 * When in postmultiply mode:
	 * All subsequent operations will occur after those already represented in the current transformation.
	 * In homogeneous matrix notation, M = A*M where M is the current transformation matrix and A is the applied matrix.
	 *
	 * This flag is also used in @see transformMatrix and @see transformMatrices to indicate how transform is applied to matrices:
	 * Premultiply: O_i = M * A_i
	 * Postmultiply: O_i = A_i * M
	 * where M is the current transformation matrix, A_i are the matrices in argument, O_i are the output matrices.
	 *
	 * The default is PreMultiply.
	 */
	getPreMultiplyFlag(): boolean;

	/**
	 * @see getPreMultiplyFlag
	 * @param preMultiplyFlag
	 */
	setPreMultiplyFlag(preMultiplyFlag: boolean): boolean;

	/**
	 * Set preMultiplyFlag to true
	 * @see getPreMultiplyFlag
	 */
	preMultiply(): void;

	/**
	 * Set preMultiplyFlag to false
	 * @see getPreMultiplyFlag
	 */
	postMultiply(): void;

	/**
	 * Transform a single point using the internal transform matrix
	 * The resulting point is: Pout = M * Pin where M is the internal matrix, Pin and Pout the in and out points
	 * @param point The point to transform, is not modified (except if point === out)
	 * @param out The receiving output point, is modified, can be the same as point
	 * @returns The out parameter
	 */
	transformPoint(point: vec3, out: vec3): vec3;

	/**
	 * Transform multiple points using the internal transform matrix
	 * See @see transformPoint for more info
	 * Modify the out array only
	 * @param points An array (typed or not) containing n*3 elements or of shape (n, 3)
	 * @param out An array (typed or not) containing n*3 elements or of shape (n, 3)
	 */
	transformPoints(points: TSlicableArray, out: TSlicableArray): TSlicableArray;


	/**
	 * Transform a single matrix using the internal transform matrix
	 * The resulting matrix is:
	 * Mout = M * Min when in premultiply mode
	 * Mout = Min * M when in postmultiply mode
	 * @param matrix The matrix to transform, is not modified (except if matrix === out)
	 * @param out The receiving output matrix, is modified, can be the same as matrix
	 * @returns The out parameter
	 */
	transformMatrix(matrix: mat4, out: mat4): mat4;

	/**
	 * Transform multiple matrices using the internal transform matrix
	 * See @see transformMatrix for more info
	 * Modify the out array only
	 * @param matrices An array (typed or not) containing n*16 elements or of shape (n, 16)
	 * @param out An array (typed or not) containing n*16 elements or of shape (n, 16)
	 */
	transformMatrices(matrices: TSlicableArray, out: TSlicableArray): TSlicableArray;

	/**
	 * @returns A new transform with an inversed internal matrix. Also copy the premultiply flag @see getPreMultiplyFlag.
	 */
	getInverse(): vtkTransform;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkTransform characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ITransformInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ITransformInitialValues): void;

/**
 * Method used to create a new instance of vtkTransform.
 * @param {ITransformInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: ITransformInitialValues): vtkTransform;


/**
 * vtkTransform describes linear transformations via a 4x4 matrix.
 *
 * A vtkTransform can be used to describe the full range of linear (also known as affine) coordinate transformations in three dimensions, which are internally represented as a 4x4 homogeneous transformation matrix. When you create a new vtkTransform, it is always initialized to the identity transformation.
 *
 * Most of the methods for manipulating this transformation (e.g. transformMatrices, transformMatrix) (TODO: Translate, Rotate, Concatenate...) can operate in either PreMultiply (the default) or PostMultiply mode. In PreMultiply mode, the translation, concatenation, etc. will occur before any transformations which are represented by the current matrix. In PostMultiply mode, the additional transformation will occur after any transformations represented by the current matrix.
 *
 * This class performs all of its operations in a right handed coordinate system with right handed rotations. Some other graphics libraries use left handed coordinate systems and rotations.
 *
 * @example
 * ```js
 * import vtkTransform from '@kitware/vtk.js/Common/Transform/Transform';
 * import vtkMatrixBuilder from '@kitware/vtk.js/Common/Core/MatrixBuilder';
 * 
 * const transform = vtkTransform.newInstance();
 * const matrix = vtkMatrixBuilder
 *   .buildFromDegree()
 *   .rotateZ(45)
 *   .getMatrix();
 * transform.setMatrix(matrix);
 * const pointsIn = [[1, 2, 3], [4, 5, 6]];
 * const pointsOut = new Float32Array(6);
 * transform.transformPoints(pointsIn, pointsOut);
 * ```
 */
export declare const vtkTransform: {
	newInstance: typeof newInstance,
	extend: typeof extend;
};
export default vtkTransform;
