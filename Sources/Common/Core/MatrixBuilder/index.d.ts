declare interface Transform {

	/**
	 * 
	 * @param useDegree 
	 */
	new (useDegree: boolean);

	/**
	 * 
	 * @param originDirection 
	 * @param targetDirection 
	 * @return  
	 */
	rotateFromDirections(originDirection: number[], targetDirection: number[]): Transform

	/**
	 * 
	 * @param angle 
	 * @param axis 
	 * @return  
	 */
	rotate(angle: number, axis: number): Transform

	/**
	 * 
	 * @param angle 
	 * @return  
	 */
	rotateX(angle: number): Transform

	/**
	 * 
	 * @param angle 
	 * @return  
	 */
	rotateY(angle: number): Transform

	/**
	 * 
	 * @param angle 
	 * @return  
	 */
	rotateZ(angle: number): Transform

	/**
	 * 
	 * @param x 
	 * @param y 
	 * @param z 
	 * @return  
	 */
	translate(x: number, y: number, z: number): Transform

	/**
	 * 
	 * @param sx 
	 * @param sy 
	 * @param sz 
	 * @return  
	 */
	scale(sx: number, sy: number, sz: number): Transform

	/**
	 * 
	 * @return  
	 */
	identity(): Transform

	/**
	 * -----------
	 * @param typedArray 
	 * @param offset 
	 * @param nbIterations 
	 * @return  
	 */
	apply(typedArray: number[], offset: number, nbIterations: number): Transform

	/**
	 * 
	 * @return  
	 */
	getMatrix(): Float64Array;

	/**
	 * 
	 * @param mat4x4 
	 * @return  
	 */
	setMatrix(mat4x4: Float64Array): Transform
}

/**
 * 
 * @return {Transform}
 */
export declare function buildFromDegree(): Transform;

/**
 * 
 * @return {Transform}
 */
export declare function buildFromRadian(): Transform;
