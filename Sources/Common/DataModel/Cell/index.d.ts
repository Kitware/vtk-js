import { VtkObject } from 'vtk.js/Sources/macro';

/**
 *
 */
interface ICellInitialValues {
	bounds?: number[];
	pointsIds?: number[];
}

export interface vtkCell extends VtkObject {

	/**
	 * Copy this cell by completely copying internal data structures.
	 * @param cell
	 */
	deepCopy(cell : any): void;

	/**
	 * Initialize the cell with point coordinates and cell point ids, example :
	 * ```js
	 * const points = vtkPoints.newInstance();
	 * points.setData(Float32Array.from([0, 0, 0, 0, 0, 1, ..., 255, 255, 255]));
	 * const pointIdsList = [13, 10, 235];
	 * // Create cell
	 * const triangle = vtkTriangle.newInstance();
	 * // Initialize cell
	 * triangle.initialize(points, pointIdsList);
	 * ```
	 * If pointIdsList is null, points are shallow copied and pointIdsList is
	 * generated as such: [0, 1, ..., N-1] where N is the number of points. If
	 * pointIdsList is not null, only pointIdsList point coordinates are copied into
	 * the cell. pointIdsList is shallow copied.
	 * @param points
	 * @param pointIdsList
	 */
	initialize(points : any, pointIdsList : any): void;

	/**
	 * Get the bounds as [xmin, xmax, ymin, ymax, zmin, zmax].
	 */
	getBounds():  number[];

	/**
	 * Compute Length squared of cell (i.e., bounding box diagonal squared).
	 */
	getLength2(): number;

	/**
	 * Return the distance of the parametric coordinate provided to the cell. If
	 * inside the cell, a distance of zero is returned. This is used during
	 * picking to get the correct cell picked. (The tolerance will occasionally
	 * allow cells to be picked who are not really intersected "inside" the
	 * cell.)
	 * @param pcoords
	 *
	 */
	getParametricDistance(pcoords : any): number;

	/**
	 * Return the number of points in the cell.
	 */
	getNumberOfPoints(): number;

	/**
	 * Return the topological dimensional of the cell (0,1,2, or 3).
	 */
	getCellDimension(): void;

	/**
	 * Intersect with a ray.
	 *
	 * Return parametric coordinates (both line and cell) and global
	 * intersection coordinates, given ray definition p1[3], p2[3] and tolerance
	 * tol. The method returns non-zero value if intersection occurs. A
	 * parametric distance t between 0 and 1 along the ray representing the
	 * intersection point, the point coordinates x[3] in data coordinates and
	 * also pcoords[3] in parametric coordinates. subId is the index within the
	 * cell if a composed cell like a triangle strip.
	 * @param p1
	 * @param p2
	 * @param tol
	 * @param t
	 * @param x
	 * @param pcoords
	 * @param subId
	 */
	intersectWithLine(p1 : any, p2 : any, tol : any, t : any, x : any, pcoords : any, subId : any): void;

	/**
	 * Given a point x[3] return inside(=1), outside(=0) cell, or (-1)
	 * computational problem encountered; evaluate parametric coordinates,
	 * sub-cell id (!=0 only if cell is composite), distance squared of point
	 * x[3] to cell (in particular, the sub-cell indicated), closest point on
	 * cell to x[3] (unless closestPoint is null, in which case, the closest
	 * point and dist2 are not found), and interpolation weights in cell. (The
	 * number of weights is equal to the number of points defining the cell).
	 * Note: on rare occasions a -1 is returned from the method. This means that
	 * numerical error has occurred and all data returned from this method
	 * should be ignored. Also, inside/outside is determine parametrically. That
	 * is, a point is inside if it satisfies parametric limits. This can cause
	 * problems for cells of topological dimension 2 or less, since a point in
	 * 3D can project onto the cell within parametric limits but be "far" from
	 * the cell. Thus the value dist2 may be checked to determine true in/out.
	 *
	 * @param x
	 * @param closestPoint
	 * @param subId
	 * @param pcoords
	 * @param dist2
	 * @param weights
	 */
	evaluatePosition(x : any, closestPoint : any, subId : any, pcoords : any, dist2 : any, weights : any): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkCell characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param initialValues (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ICellInitialValues): void;

/**
 * Method used to create a new instance of vtkCell.
 * @param initialValues for pre-setting some of its content
 */
export function newInstance(initialValues?: ICellInitialValues): vtkCell;

/**
 * vtkCell is an abstract method to define a cell
 */
export declare const vtkCell: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkCell;
