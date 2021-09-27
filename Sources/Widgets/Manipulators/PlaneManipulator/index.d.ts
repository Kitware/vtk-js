import { vtkObject } from "../../../interfaces";

/**
 *
 */
export interface IPlaneManipulatorInitialValues {
	origin?: number[];
	normal?: number[];
}

export interface vtkPlaneManipulator extends vtkObject {

	/**
	 * Get the normal of the plane
	 */
	getNormal(): number[];

	/**
	 * Get the normal of the plane
	 */
	getNormalByReference(): number[];

	/**
	 * Get the origin of the plane
	 */
	getOrigin(): number[];

	/**
	 * Get the origin of the plane
	 */
	getOriginByReference(): number[];

	/**
	 * 
	 * @param callData 
	 * @param glRenderWindow 
	 */
	handleEvent(callData: any, glRenderWindow: any): number[];

	/**
	 * Set the normal of the plane
	 * @param {Number[]} normal The normal coordinate.
	 */
	setNormal(normal: number[]): boolean;

	/**
	 * Set the normal of the plane
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setNormal(x: number, y: number, z: number): boolean;

	/**
	 * Set the normal of the plane
	 * @param {Number[]} normal The normal coordinate.
	 */
	setNormalFrom(normal: number[]): boolean;

	/**
	 * Set the origin of the plane.
	 * @param {Number[]} origin The coordinate of the origin point.
	 */
	setOrigin(origin: number[]): boolean;

	/**
	 * Set the origin of the plane.
	 * @param {Number} x The x coordinate of the origin point.
	 * @param {Number} y The y coordinate of the origin point.
	 * @param {Number} z The z coordinate of the origin point.
	 */
	setOrigin(x: number, y: number, z: number): boolean;

	/**
	 * Set the origin of the plane.
	 * @param {Number[]} origin The coordinate of the origin point.
	 */
	setOriginFrom(origin: number[]): boolean;
}


/**
 * Method use to decorate a given object (publicAPI+model) with vtkPlaneManipulator characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IPlaneManipulatorInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IPlaneManipulatorInitialValues): void;

/**
 * Method use to create a new instance of vtkPlaneManipulator
 */
export function newInstance(initialValues?: IPlaneManipulatorInitialValues): vtkPlaneManipulator;

/**
 * 
 * @param {Number} x 
 * @param {Number} y 
 * @param {Number[]} planeOrigin 
 * @param {Number[]} planeNormal 
 * @param renderer 
 * @param glRenderWindow 
 */
export function intersectDisplayWithPlane(x: number, y: number, planeOrigin: number[], planeNormal: number[], renderer: any, glRenderWindow: any): number[];


/**
 * vtkPlaneManipulator.
 */
export declare const vtkPlaneManipulator: {
	newInstance: typeof newInstance,
	extend: typeof extend,
	intersectDisplayWithPlane: typeof intersectDisplayWithPlane;
};
export default vtkPlaneManipulator;
