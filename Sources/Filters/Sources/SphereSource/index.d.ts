import { vtkAlgorithm, vtkObject } from "../../../interfaces";
import { Vector3 } from "../../../types";

/**
 * 
 */
export interface ISphereSourceInitialValues {
	radius?: number;
	latLongTessellation?: boolean;
	thetaResolution?: number;
	startTheta?: number;
	endTheta?: number;
	phiResolution?: number;
	startPhi?: number;
	endPhi?: number;
	center?: Vector3;
	pointType?: string;
}

type vtkSphereSourceBase = vtkObject & Omit<vtkAlgorithm,
	| 'getInputData'
	| 'setInputData'
	| 'setInputConnection'
	| 'getInputConnection'
	| 'addInputConnection'
	| 'addInputData'>;

export interface vtkSphereSource extends vtkSphereSourceBase {

	/**
	 * Get the center of the sphere.
	 * @default [0, 0, 0]
	 */
	getCenter(): Vector3;

	/**
	 * Get the center of the sphere.
	 */
	getCenterByReference(): Vector3;


	/**
	 * Get the ending latitude angle.
	 * @default 180.0
	 */
	getEndPhi(): number;

	/**
	 * Set the ending longitude angle.
	 * @default 360.0
	 */
	getEndTheta(): number;

	/**
	 * 
	 * @default false
	 */
	getLatLongTessellation(): boolean;

	/**
	 * Get the number of points in the latitude direction (ranging from StartPhi to EndPhi).
	 * @default 8
	 */
	getPhiResolution(): number;

	/**
	 * Get the radius of sphere.
	 * @default 0.5
	 */
	getRadius(): number;

	/**
	 * Get the starting latitude angle in degrees (0 is at north pole).
	 * @default 0.0
	 */
	getStartPhi(): number;

	/**
	 * Get the starting longitude angle.
	 * @default 0.0
	 */
	getStartTheta(): number;

	/**
	 * Get the number of points in the longitude direction (ranging from StartTheta to EndTheta).
	 * @default 8
	 */
	getThetaResolution(): number;

	/**
	 * 
	 * @param inData 
	 * @param outData 
	 */
	requestData(inData: any, outData: any): void;

	/**
	 * Set the center of the sphere.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setCenter(x: number, y: number, z: number): boolean;

	/**
	 * Set the center of the sphere.
	 * @param {Vector3} center The center point's coordinates.
	 */
	setCenter(center: Vector3): boolean;

	/**
	 * Set the center of the sphere.
	 * @param {Vector3} center The center point's coordinates.
	 */
	setCenterFrom(center: Vector3): boolean;

	/**
	 * Set the ending latitude angle.
	 * @param {Number} endPhi The ending latitude angle in degrees.
	 */
	setEndPhi(endPhi: number): boolean;

	/**
	 * Set the ending longitude angle.
	 * @param {Number} endTheta The ending latitude longitude in degrees.
	 */
	setEndTheta(endTheta: number): boolean;

	/**
	 * Cause the sphere to be tessellated with edges along the latitude and
	 * longitude lines. If off, triangles are generated at non-polar regions,
	 * which results in edges that are not parallel to latitude and longitude
	 * lines. If on, quadrilaterals are generated everywhere except at the
	 * poles. This can be useful for generating a wireframe sphere with natural
	 * latitude and longitude lines.
	 * @param {Boolean} latLongTessellation 
	 */
	setLatLongTessellation(latLongTessellation: boolean): boolean;

	/**
	 * Set the number of points in the latitude direction (ranging from StartPhi to EndPhi).
	 * @param {Number} phiResolution The number of points.
	 */
	setPhiResolution(phiResolution: number): boolean;

	/**
	 * Set the radius of sphere.
	 * @param {Number} radius The radius of sphere.
	 */
	setRadius(radius: number): boolean;

	/**
	 * Set the starting longitude angle.
	 * @param {Number} startTheta The starting longitude angle in degrees.
	 */
	setStartTheta(startTheta: number): boolean;

	/**
	 * Set the starting latitude angle (0 is at north pole).
	 * @param {Number} startPhi The starting latitude angle in degrees.
	 */
	setStartPhi(startPhi: number): boolean;

	/**
	 * Set the number of points in the longitude direction (ranging from StartTheta to EndTheta).
	 * @param {Number} thetaResolution The number of points.
	 */
	setThetaResolution(thetaResolution: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkSphereSource characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ISphereSourceInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ISphereSourceInitialValues): void;

/**
 * Method used to create a new instance of vtkSphereSource.
 * @param {ISphereSourceInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: ISphereSourceInitialValues): vtkSphereSource;

/**
 * vtkSphereSource is a source object that creates a user-specified number of
 * points within a specified radius about a specified center point. By default
 * location of the points is random within the sphere. It is also possible to
 * generate random points only on the surface of the sphere. The output PolyData
 * has the specified number of points and 1 cell - a vtkPolyVertex containing
 * all of the points.
 * 
 * @example
 * ```js
 * import vtkSphereSource from '@kitware/vtk.js/Filters/Sources/SphereSource';
 * 
 * const sphere = vtkSphereSource.newInstance();
 * const polydata = sphere.getOutputData();
 * ```
 */
export declare const vtkSphereSource: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkSphereSource;
