import { mat4 } from 'gl-matrix';
import { TypedArray } from 'vtk.js/Sources/macro';

declare interface Transform {

	/**
	 * 
	 * @param useDegree 
	 */
	new (useDegree?: boolean);

	/**
	 * Multiplies the current matrix with a transformation matrix created by
	 * normalizing both direction vectors and rotating around the axis of the
	 * crossProduct by the angle from the dotProduct of the two directions.
	 * @param originDirection 
	 * @param targetDirection 
	 * @return  
	 */
	rotateFromDirections(originDirection: number[], targetDirection: number[]): Transform

	/**
	 * Normalizes the axis of rotation then rotates the current matrix `angle`
	 * degrees/radians around the provided axis.
	 * @param angle 
	 * @param axis 
	 * @return  
	 */
	rotate(angle: number, axis: number): Transform

	/**
	 * Rotates `angle` degrees/radians around the X axis.
	 * @param angle 
	 * @return  
	 */
	rotateX(angle: number): Transform

	/**
	 * Rotates `angle` degrees/radians around the Y axis.
	 * @param angle 
	 * @return  
	 */
	rotateY(angle: number): Transform

	/**
	 * Rotates `angle` degrees/radians around the Z axis.
	 * @param angle 
	 * @return  
	 */
	rotateZ(angle: number): Transform

	/**
	 * Translates the matrix by x, y, z.
	 * @param x 
	 * @param y 
	 * @param z 
	 * @return  
	 */
	translate(x: number, y: number, z: number): Transform

	/**
	 * Scales the matrix by sx, sy, sz.
	 * @param sx 
	 * @param sy 
	 * @param sz 
	 * @return  
	 */
	scale(sx: number, sy: number, sz: number): Transform

	/**
	 * Resets the MatrixBuilder to the Identity matrix.
	 * @param mat4x4 
	 * @return  
	 */
	multiply(mat4x4: mat4): Transform

	/**
	 * Resets the MatrixBuilder to the Identity matrix.
	 * @return
	 */	
	identity(): Transform

	/**
	 * Multiplies the array by the MatrixBuilder's internal matrix, in sets of
	 * 3. Updates the array in place. If specified, `offset` starts at a given
	 * position in the array, and `nbIterations` will determine the number of
	 * iterations (sets of 3) to loop through. Assumes the `typedArray` is an
	 * array of multiples of 3, unless specifically handling with offset and
	 * iterations. Returns the instance for chaining.
	 * @param typedArray 
	 * @param offset 
	 * @param nbIterations 
	 * @return  
	 */
	apply(typedArray: TypedArray, offset?: number, nbIterations?: number): Transform

	/**
	 * Returns the internal `mat4` matrix.
	 * @return  
	 */
	getMatrix(): mat4;

	/**
	 * Copies the given `mat4` into the builder. Useful if you already have a
	 * transformation matrix and want to transform it further. Returns the
	 * instance for chaining.
	 * @param mat4x4 
	 * @return  
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
 * instance, allowing transformations to be chained. Example:
 * ```js
 * let point = [2,5,12];
 * vtkMatrixBuilder.buildfromDegree().translate(1,0,2).rotateZ(45).apply(point);
 * ```
 * ## Usage
 * The vtkMatrixBuilder class has two functions,
 * `vtkMatrixBuilder.buildFromDegree()` and
 * `vtkMatrixbuilder.buildFromRadian()`, predefining the angle format used for
 * transformations and returning a MatrixBuilder instance. The matrix is
 * initialized with the Identity Matrix.
 *
 */
declare const vtkMatrixBuilder: {
  buildFromDegree: typeof buildFromDegree,
  buildFromRadian: typeof buildFromRadian,
};

export default vtkMatrixBuilder;
