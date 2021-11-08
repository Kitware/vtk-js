import { mat4 } from "gl-matrix";
import { Bounds, Vector3, Range } from "../../../types";
import vtkProp, { IPropInitialValues } from "../Prop";

export interface IProp3DInitialValues extends IPropInitialValues {
	origin?: number[];
	position?: Vector3;
	orientation?: number[];
	scale?: number[];
	bounds?: Bounds;
	isIdentity?: boolean;
}

export interface vtkProp3D extends vtkProp {

	/**
	 * Add the position of the Prop3D in world coordinates.
	 * @param deltaXYZ 
	 */
	addPosition(deltaXYZ: number[]): void;

	/**
	 * Get the bounds as [xmin, xmax, ymin, ymax, zmin, zmax].
	 * @return {Bounds} The bounds for the mapper.
	 */
	getBounds(): Bounds;

	/**
	 * Check if there was a modification or transformation.
	 * @default null
	 * @return {Boolean} true if no modification/transformation have been set.
	 */
	getIsIdentity(): boolean;

	/**
	 * The ordering in which these rotations must be done to generate the same
	 * matrix is RotateZ, RotateX, and finally RotateY. See also `SetOrientation`.
	 * @return {Number[]} the orientation of the Prop3D as s vector of X, Y and Z rotation.
	 */
	getOrientation(): number[];

	/**
	 * Get a reference of the orientation of the Prop3D as s vector of X, Y and Z
	 * rotation.
	 * @return {Number[]} the orientation of the Prop3D as s vector of X, Y and Z rotation.
	 */
	getOrientationByReference(): number[];

	/**
	 * Get the WXYZ orientation of the Prop3D.
	 */
	getOrientationWXYZ(): number[];

	/**
	 * Get the origin of the Prop3D. This is the point about which all rotations
	 * take place.
	 */
	getOrigin(): number[];

	/**
	 * Get a reference of the origin of the Prop3D. This is the point about
	 * which all rotations take place.
	 */
	getOriginByReference(): number[];

	/**
	 * Get the position of the Prop3D in world coordinates.
	 */
	getPosition(): number[];

	/**
	 * Get a refrence of the position of the Prop3D in world coordinates.
	 */
	getPositionByReference(): number[];

	/**
	 * Get the scale of the actor.
	 */
	getScale(): number[];

	/**
	 * Get a refrence of the scale of the actor.
	 */
	getScaleByReference(): number[];

	/**
	 * Get the WXYZ orientation of the Prop3D.
	 */
	getOrientationWXYZ(): number[];

	/**
	 * Get a reference to the Prop3D’s 4x4 composite matrix.
	 * Get the matrix from the position, origin, scale and orientation This
	 * matrix is cached, so multiple GetMatrix() calls will be efficient.
	 */
	getMatrix(): mat4;

	/**
	 * Get the center of the bounding box in world coordinates.
	 */
	getCenter(): number[];

	/**
	 * Get the length of the diagonal of the bounding box.
	 */
	getLength(): number;

	/**
	 * Get the Prop3D's x range in world coordinates.
	 */
	getXRange(): Range;

	/**
	 * Get the Prop3D's y range in world coordinates.
	 */
	getYRange(): Range;

	/**
	 * Get the Prop3D's z range in world coordinates.
	 */
	getZRange(): Range;

	/**
	 * Get the transformation matrix set for your own use.
	 */
	getUserMatrix(): mat4;

	/**
	 * Rotate the Prop3D in degrees about the X axis using the right hand
	 * rule. The axis is the Prop3D’s X axis, which can change as other
	 * rotations are performed. To rotate about the world X axis use
	 * RotateWXYZ (angle, 1, 0, 0). This rotation is applied before all
	 * others in the current transformation matrix.
	 * @param {Number} angle The angle value.
	 */
	rotateX(angle: number): void;

	/**
	 * Rotate the Prop3D in degrees about the Y axis using the right hand
	 * rule. The axis is the Prop3D’s Y axis, which can change as other
	 * rotations are performed. To rotate about the world Y axis use
	 * RotateWXYZ (angle, 0, 1, 0). This rotation is applied before all
	 * others in the current transformation matrix.
	 * @param {Number} angle The angle value.
	 */
	rotateY(angle: number): void;

	/**
	 * Rotate the Prop3D in degrees about the Z axis using the right hand
	 * rule. The axis is the Prop3D’s Z axis, which can change as other
	 * rotations are performed. To rotate about the world Z axis use
	 * RotateWXYZ (angle, 0, 0, 1). This rotation is applied before all
	 * others in the current transformation matrix.
	 * @param {Number} angle The angle value.
	 */
	rotateZ(angle: number): void;

	/**
	 * Rotate the Prop3D in degrees about an arbitrary axis specified by
	 * the last three arguments. The axis is specified in world
	 * coordinates. To rotate an about its model axes, use RotateX,
	 * RotateY, RotateZ.
	 * @param {Number} degrees The angle value.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	rotateWXYZ(degrees: number, x: number, y: number, z: number): void;

	/**
	 * Orientation is specified as X, Y and Z rotations in that order,
	 * but they are performed as RotateZ, RotateX, and finally RotateY.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setOrientation(x: number, y: number, z: number): boolean;

	/**
	 * Set the origin of the Prop3D. This is the point about which all rotations take place.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setOrigin(x: number, y: number, z: number): boolean;

	/**
	 * Set the origin of the Prop3D. This is the point about which all rotations
	 * take place.
	 * @param {Number[]} origin
	 */
	setOrigin(origin: number[]): boolean;


	/**
	 * Set the origin of the Prop3D. This is the point about which all rotations
	 * take place.
	 * @param {Number[]} origin 
	 */
	setOriginFrom(origin: number[]): boolean;

	/**
	 * Set the origin of the Prop3D.
	 * This is the point about which all rotations take place.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setPosition(x: number, y: number, z: number): boolean;

	/**
	 * Set the origin of the Prop3D.
	 * @param {Vector3} position 
	 */
	setPositionFrom(position: Vector3): boolean;

	/**
	 * Set the scale of the actor.
	 * Scaling in performed independently on the X, Y and Z axis. A scale of zero is illegal and will be replaced with one.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setScale(x: number, y: number, z: number): boolean;

	/**
	 * 
	 * @param {Number[]} scale 
	 */
	setScaleFrom(scale: number[]): boolean;

	/**
	 * In addition to the instance variables such as position and orientation,
	 * you can add an additional transformation matrix for your own use. This
	 * matrix is concatenated with the actor's internal matrix, which you
	 * implicitly create through the use of setPosition(), setOrigin() and
	 * setOrientation().
	 * @param {mat4} matrix 
	 */
	setUserMatrix(matrix: mat4): void;

	/**
	 * Generate the matrix based on internal model.
	 */
	computeMatrix(): void;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkProp3D characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IProp3DInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IProp3DInitialValues): void;

/**
 * Method use to create a new instance of vtkProp3D
 * @param {IProp3DInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IProp3DInitialValues): vtkProp3D;

/** 
 * vtkProp3D is an abstract class used to represent an entity in a rendering
 * scene (i.e., vtkProp3D is a vtkProp with an associated transformation
 * matrix). It handles functions related to the position, orientation and
 * scaling. It combines these instance variables into one 4x4 transformation
 * matrix as follows: [x y z 1] = [x y z 1] Translate(-origin) Scale(scale)
 * Rot(y) Rot(x) Rot (z) Trans(origin) Trans(position). Both vtkActor and
 * vtkVolume are specializations of class vtkProp. The constructor defaults
 * to: origin(0,0,0) position=(0,0,0) orientation=(0,0,0), no user defined
 * matrix or transform, and no texture map.
 */
export declare const vtkProp3D: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkProp3D;
