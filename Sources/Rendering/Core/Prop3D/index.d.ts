import { mat4 } from "gl-matrix";
import vtkProp from "vtk.js/Sources/Rendering/Core/Prop";

interface IProp3DInitialValues {

    /**
     * 
     */
    origin: number[];

    /**
     * 
     */
    position: number[];

    /**
     * 
     */
    orientation: number[];

    /**
     * 
     */
    scale: number[];

    /**
     * 
     */
    bounds: number[];

    /**
     * check for identity
     */
    isIdentity: boolean;
}

export interface vtkProp3D extends vtkProp {

    /**
     * Add the position of the Prop3D in world coordinates.
     * @param deltaXYZ 
     */
    addPosition(deltaXYZ: number[]): void;

    /**
     * Get the bounds for this Actor as (Xmin,Xmax,Ymin,Ymax,Zmin,Zmax).
     * @returns 
     */
    getBounds(): number[];

    /**
     * 
     * @default null
     * @returns true if no modification/transformation have been set.
     */
    getIsIdentity(): boolean;

    /**
     * The ordering in which these rotations must be done to generate the same matrix is RotateZ, RotateX, and finally RotateY. See also SetOrientation.
     * @returns the orientation of the Prop3D as s vector of X,Y and Z rotation.
     */
    getOrientation(): number[];

    /**
     * 
     */
    getOrientationByReference(): number[];

    /**
     * Get the WXYZ orientation of the Prop3D.
     */
    getOrientationWXYZ(): number[];

    /**
     * Get the origin of the Prop3D. This is the point about which all rotations take place.
     */
    getOrigin(): number[];

    /**
     * 
     */
    getOriginByReference(): number[];

    /**
     * 
     */
    getPosition(): number[];

    /**
     * 
     */
    getPositionByReference(): number[];

    /**
     * Get the scale of the actor.
     */
    getScale(): number[];

    /**
     * 
     */
    getScaleByReference(): number[];

    /**
     * Returns the WXYZ orientation of the Prop3D.
     * @return  
     */
    getOrientationWXYZ(): any;

    /**
     * Return a reference to the Prop3D’s 4x4 composite matrix.
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
    getXRange(): number[];

    /**
     * Get the Prop3D's y range in world coordinates.
     */
    getYRange(): number[];

    /**
     * Get the Prop3D's z range in world coordinates.
     */
    getZRange(): number[];

    /**
     * 
     */
    getUserMatrix(): mat4;

    /**
     * Rotate the Prop3D in degrees about the X axis using the right hand
     * rule. The axis is the Prop3D’s X axis, which can change as other
     * rotations are performed. To rotate about the world X axis use
     * RotateWXYZ (angle, 1, 0, 0). This rotation is applied before all
     * others in the current transformation matrix.
     * @param angle 
     */
    rotateX(angle: number): void;

    /**
     * Rotate the Prop3D in degrees about the Y axis using the right hand
     * rule. The axis is the Prop3D’s Y axis, which can change as other
     * rotations are performed. To rotate about the world Y axis use
     * RotateWXYZ (angle, 0, 1, 0). This rotation is applied before all
     * others in the current transformation matrix.
     * @param angle 
     */
    rotateY(angle: number): void;

    /**
     * Rotate the Prop3D in degrees about the Z axis using the right hand
     * rule. The axis is the Prop3D’s Z axis, which can change as other
     * rotations are performed. To rotate about the world Z axis use
     * RotateWXYZ (angle, 0, 0, 1). This rotation is applied before all
     * others in the current transformation matrix.
     * @param angle 
     */
    rotateZ(angle: number): void;

    /**
     * Rotate the Prop3D in degrees about an arbitrary axis specified by
     * the last three arguments. The axis is specified in world
     * coordinates. To rotate an about its model axes, use RotateX,
     * RotateY, RotateZ.
     * @param degrees 
     * @param x 
     * @param y 
     * @param z 
     */
    rotateWXYZ(degrees: number, x: number, y: number, z: number): void;

    /**
     * Orientation is specified as X, Y and Z rotations in that order,
     * but they are performed as RotateZ, RotateX, and finally RotateY.
     * @param x 
     * @param y 
     * @param z 
     * @return  
     */
    setOrientation(x: number, y: number, z: number): boolean;

    /**
     * Set the origin of the Prop3D. This is the point about which all rotations take place.
     * @param x 
     * @param y 
     * @param z 
     */
    setOrigin(x: number, y: number, z: number): boolean;

    /**
     * 
     * @param origin 
     */
    setOriginFrom(origin: number[]): boolean;

    /**
     * Set the origin of the Prop3D.
     * This is the point about which all rotations take place.
     * @param x 
     * @param y 
     * @param z 
     */
    setPosition(x: number, y: number, z: number): boolean;

    /**
     * 
     * @param position 
     */
    setPositionFrom(position: number[]): boolean;

    /**
     * Set the scale of the actor.
     * Scaling in performed independently on the X, Y and Z axis. A scale of zero is illegal and will be replaced with one.
     * @param x 
     * @param y 
     * @param z 
     */
    setScale(x: number, y: number, z: number): boolean;

    /**
     * 
     * @param scale 
     */
    setScaleFrom(scale: number[]): boolean;

    /**
     * The UserMatrix can be used in place of UserTransform.
     * @param matrix 
     */
    setUserMatrix(matrix: mat4): any;

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
 * @param initialValues (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IProp3DInitialValues): void;

/**
 * Method use to create a new instance of vtkProp3D
 * @param initialValues for pre-setting some of its content
 */
export function newInstance(initialValues?: IProp3DInitialValues): vtkProp3D;

/** 
 * Introduction
 * ---------------------------------------------------------------------------
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
