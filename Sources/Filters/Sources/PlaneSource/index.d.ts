import { vec3 } from 'gl-matrix';
import { vtkAlgorithm, vtkObject } from "vtk.js/Sources/interfaces";

/**
 * 
 */
interface IPlaneSourceInitialValues {
	xResolution?: number;
	yResolution?: number;
	origin?: number[];
	point1?: number[];
	point2?: number[];
	pointType?: string;
}

type vtkPlaneSourceBase = vtkObject & Omit<vtkAlgorithm,
	| 'getInputData'
	| 'setInputData'
	| 'setInputConnection'
	| 'getInputConnection'
	| 'addInputConnection'
	| 'addInputData'>;

export interface vtkPlaneSource extends vtkPlaneSourceBase {

	/**
	 * Get the center of the plane.
	 * @default [0, 0, 0]
	 */
	getCenter(): number[];

	/**
	 * Get the center of the plane.
	 */
	getCenterByReference(): number[];

	/**
	 * Get the normal of the plane.
	 * @default [0, 0, 1]
	 */
	getNormal(): number[];

	/**
	 * Get the normal of the plane.
	 */
	getNormalByReference(): number[];

	/**
	 * Get the origin of the plane, lower-left corner.
	 * @default [0, 0, 0]
	 */
	getOrigin(): number[];

	/**
	 * Get the origin of the plane, lower-left corner.
	 */
	getOriginByReference(): number[];

	/**
	 * Get the x axes of the plane.
	 * @default [1, 0, 0]
	 */
	getPoint1(): number[];

	/**
	 * Get the x axes of the plane.
	 */
	getPoint1ByReference(): number[];

	/**
	 * Get the y axes of the plane.
	 * @default [0, 1, 0]
	 */
	getPoint2(): number[];

	/**
	 * Get the y axes of the plane.
	 */
	getPoint2ByReference(): number[];

	/**
	 * Get the x resolution of the plane.
	 * @default 10
	 */
	getXResolution(): number;

	/**
	 * Get the y resolution of the plane.
	 * @default 10
	 */
	getYResolution(): number;

	/**
	 * 
	 * @param inData 
	 * @param outData 
	 */
	requestData(inData: any, outData: any): void;

	/**
	 * Rotate plane around a given axis
	 * @param angle theta Angle (radian) to rotate about
	 * @param rotationAxis Axis to rotate around
	 */
	rotate(angle: number, rotationAxis: vec3): void;

	/**
	 * Set the center of the plane.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setCenter(x: number, y: number, z: number): void;

	/**
	 * Set the center of the plane.
	 * @param {Number[]} center The coordinate of the center point.
	 */
	setCenter(center: number[]): void;

	/**
	 * Set the normal of the plane.
	 * @param {Number[]} normal The normal coordinate.
	 */
	setNormal(normal: number[]): boolean;

	/**
	 * Set the normal of the plane.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setNormal(x: number, y: number, z: number): boolean;

	/**
	 * Set the normal of the plane.
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

	/**
	 * Specify a point defining the first axis of the plane.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setPoint1(x: number, y: number, z: number): boolean;

	/**
	 * Specify a point defining the first axis of the plane.
	 * @param {Number[]} point1 
	 */
	setPoint1(point1: number[]): boolean;

	/**
	 * Specify a point defining the second axis of the plane.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setPoint2(x: number, y: number, z: number): boolean;

	/**
	 * Specify a point defining the second axis of the plane.
	 * @param {Number[]} point2 
	 */
	setPoint2(point2: number[]): boolean;

	/**
	 * Set the number of facets used to represent the cone.
	 * @param {Number} xResolution 
	 */
	setXResolution(xResolution: number): boolean;

	/**
	 * Set the number of facets used to represent the cone.
	 * @param {Number} yResolution 
	 */
	setYResolution(yResolution: number): boolean;

	/**
	 * 
	 * @param {vec3} v1 
	 * @param {vec3} v2 
	 */
	updatePlane(v1: vec3, v2: vec3): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkPlaneSource characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IPlaneSourceInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IPlaneSourceInitialValues): void;

/**
 * Method used to create a new instance of vtkPlaneSource.
 * @param {IPlaneSourceInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IPlaneSourceInitialValues): vtkPlaneSource;

/**
 * vtkPlaneSource creates an m x n array of quadrilaterals arranged as a regular
 * tiling in a plane. The plane is defined by specifying an origin point, and then
 * two other points that, together with the origin, define two axes for the plane.
 * These axes do not have to be orthogonal - so you can create a parallelogram.
 * (The axes must not be parallel.) The resolution of the plane (i.e., number of
 * subdivisions) is controlled by the ivars XResolution and YResolution.
 * 
 * By default, the plane is centered at the origin and perpendicular to the z-axis,
 * with width and height of length 1 and resolutions set to 1.
 * 
 * @example
 * ```js
 * import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';
 * 
 * const plane = vtkPlaneSource.newInstance({ xResolution: 10, yResolution: 10 });
 * const polydata = plane.getOutputData();
 * ```
 */
export declare const vtkPlaneSource: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkPlaneSource;
