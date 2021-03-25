import { vec3 } from 'gl-matrix';
import vtkPointSet from 'vtk.js/Sources/Common/DataModel/PointSet';

/**
 * 
 */
interface IPolyDataInitialValues {
}


export interface vtkPolyData extends vtkPointSet {

	/**
	 * 
	 */
	buildCells(): void;

	/**
	 * Create upward links from points to cells that use each point. Enables
	 * topologically complex queries.
	 * @param initialSize 
	 */
	buildLinks(initialSize : any): void;

	/**
	 * If you know the type of cell, you may provide it to improve performances.
	 * @param cellId 
	 * @param cellHint 
	 */
	getCell(cellId : any, cellHint : any): void;
	
	/**
	 * 
	 * @param cellId 
	 * @param point1 
	 * @param point2 
	 */
	getCellEdgeNeighbors(cellId : any, point1 : any, point2 : any): void;

	/**
	 * Returns an object made of the cellType and a subarray `cellPointIds` of
	 * the cell points.
	 * @param cellId 
	 */
	getCellPoints(cellId : number): object;

	/**
	 * 
	 */
	getCells(): any;

	/**
	 * 
	 */
	getLines(): any;

	/**
	 * 
	 */
	getLinks(): any;

	/**
	 * 
	 */
	getNumberOfCells(): number;
	
	/**
	 * 
	 */
	getNumberOfLines(): number;

	/**
	 * 
	 */
	getNumberOfPoints(): number;

	/**
	 * 
	 */
	getNumberOfPolys(): number;

	/**
	 * 
	 */
	getNumberOfStrips(): number;

	/**
	 * 
	 */
	getNumberOfVerts(): number;

	/**
	 * 
	 * @param ptId 
	 */
	getPointCells(ptId : any): void;

	/**
	 * 
	 */
	getPolys(): any;

	/**
	 * 
	 */
	getStrips(): any;

	/**
	 * Get the cell array defining vertices. If there are no vertices, an empty
	 * array will be returned (convenience to simplify traversal).
	 */
	getVerts(): any;

	/**
	 * 
	 * @param lines 
	 */
	setLines(lines: any): boolean;

	/**
	 * 
	 * @param polys 
	 */
	setPolys(polys: any): boolean;

	/**
	 * 
	 * @param strips 
	 */
	setStrips(strips: any): boolean;

	/**
	 * Set the cell array defining vertices.
	 * @param verts 
	 */
	setVerts(verts: any): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkPolyData characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param initialValues (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IPolyDataInitialValues): void;

/**
 * Method used to create a new instance of vtkPolyData.
 * @param initialValues for pre-setting some of its content
 */
export function newInstance(initialValues?: IPolyDataInitialValues): vtkPolyData;

/**
 * vtkPolyData creates an m x n array of quadrilaterals arranged as a regular
 * tiling in a plane. The plane is defined by specifying an origin point, and then
 * two other points that, together with the origin, define two axes for the plane.
 * These axes do not have to be orthogonal - so you can create a parallelogram.
 * (The axes must not be parallel.) The resolution of the plane (i.e., number of
 * subdivisions) is controlled by the ivars XResolution and YResolution.
 * 
 * By default, the plane is centered at the origin and perpendicular to the z-axis,
 * with width and height of length 1 and resolutions set to 1.
 */
export declare const vtkPolyData: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkPolyData;
