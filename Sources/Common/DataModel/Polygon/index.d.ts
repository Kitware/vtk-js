import { vtkObject } from "../../../interfaces" ;
import { Vector3 } from "../../../types";


export interface IPolygonInitialValues {
	firstPoint?: Vector3,
	pointCount?: number,
	tris?: Vector3[],
}

export interface vtkPolygon extends vtkObject {

	/**
	 * Get the array of triangles that triangulate the polygon.
	 */
	getPointArray(): Vector3[];

	/**
	 * Set the polygon's points
	 * @param {Vector3[]} points The polygon's points.
	 */
	setPoints(points: Vector3[]): void;

	/**
	 * Triangulate this polygon. 
	 * The output data must be accessed through `getPointArray`.
	 * The output data contains points by group of three: each three-group
	 * defines one triangle.
	 */
	triangulate(): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkPolygon characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IPolygonInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IPolygonInitialValues): void;

/**
 * Method used to create a new instance of vtkPolygon.
 * @param {IPolygonInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IPolygonInitialValues): vtkPolygon;

/**
 * vtkPolygon represents a 2D n-sided polygon.
 * 
 * The polygons cannot have any internal holes, and cannot self-intersect.
 * Define the polygon with n-points ordered in the counter-clockwise direction.
 * Do not repeat the last point.
 */
export declare const vtkPolygon: {
	newInstance: typeof newInstance,
	extend: typeof extend;
};
export default vtkPolygon;
