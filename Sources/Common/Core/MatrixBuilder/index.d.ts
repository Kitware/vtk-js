import { mat4 } from 'gl-matrix';
import { TypedArray, Vector3 } from '../../../types';

declare interface Transform {

	/**
	 * 
	 * @param {Boolean} [useDegree] 
	 */
	new (useDegree?: boolean);

	/**
	 * Multiplies the current matrix with a transformation matrix created by
	 * normalizing both direction vectors and rotating around the axis of the
	 * crossProduct by the angle from the dotProduct of the two directions.
	 * @param {Number[]} originDirection 
	 * @param {Number[]} targetDirection 
	 */
	rotateFromDirections(originDirection: number[], targetDirection: number[]): Transform

	/**
	 * Normalizes the axis of rotation then rotates the current matrix `angle`
	 * degrees/radians around the provided axis.
	 * @param {Number} angle 
	 * @param {Vector3} axis 
	 */
	rotate(angle: number, axis: Vector3): Transform

	/**
	 * Rotates `angle` degrees/radians around the X axis.
	 * @param {Number} angle 
	 */
	rotateX(angle: number): Transform

	/**
	 * Rotates `angle` degrees/radians around the Y axis.
	 * @param {Number} angle 
	 */
	rotateY(angle: number): Transform

	/**
	 * Rotates `angle` degrees/radians around the Z axis.
	 * @param {Number} angle 
	 */
	rotateZ(angle: number): Transform

	/**
	 * Translates the matrix by x, y, z.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	translate(x: number, y: number, z: number): Transform

	/**
	 * Scales the matrix by sx, sy, sz.
	 * @param {Number} sx 
	 * @param {Number} sy 
	 * @param {Number} sz 
	 */
	scale(sx: number, sy: number, sz: number): Transform

	/**
	 *
	 * @param {mat4} mat4x4 
	 */
	multiply(mat4x4: mat4): Transform

	/**
	 * Resets the MatrixBuilder to the Identity matrix.
	 */	
	identity(): Transform

	/**
	 * Multiplies the array by the MatrixBuilder's internal matrix, in sets of
	 * 3. Updates the array in place. If specified, `offset` starts at a given
	 * position in the array, and `nbIterations` will determine the number of
	 * iterations (sets of 3) to loop through. Assumes the `typedArray` is an
	 * array of multiples of 3, unless specifically handling with offset and
	 * iterations. Returns the instance for chaining.
	 * @param {TypedArray} typedArray 
	 * @param {Number} [offset] 
	 * @param {Number} [nbIterations] 
	 */
	apply(typedArray: TypedArray, offset?: number, nbIterations?: number): Transform

	/**
	 * Returns the internal `mat4` matrix.
	 */
	getMatrix(): mat4;

	/**
	 * Copies the given `mat4` into the builder. Useful if you already have a
	 * transformation matrix and want to transform it further. Returns the
	 * instance for chaining.
	 * @param {mat4} mat4x4 
	 */
	setMatrix(mat4x4: mat4): Transform
}

/**
 * 
 * @return {Transform}
 */
declare function buildFromDegree(): Transform;

/**
 * 
 * @return {Transform}
 */
declare function buildFromRadian(): Transform;


/**
 * The `vtkMatrixBuilder` class provides a system to create a mat4
 * transformation matrix. All functions return the MatrixBuilder Object
 * instance, allowing transformations to be chained.
 * 
 * @example
 * ```js
 * let point = [2,5,12];
 * vtkMatrixBuilder.buildFromDegree().translate(1,0,2).rotateZ(45).apply(point);
 * ```
 * 
 * The vtkMatrixBuilder class has two functions, `vtkMatrixBuilder.buildFromDegree()` and
 * `vtkMatrixbuilder.buildFromRadian()`, predefining the angle format used for
 * transformations and returning a MatrixBuilder instance. The matrix is
 * initialized with the Identity Matrix.
 *
 */
export declare const vtkMatrixBuilder: {
  buildFromDegree: typeof buildFromDegree,
  buildFromRadian: typeof buildFromRadian,
};

export default vtkMatrixBuilder;
