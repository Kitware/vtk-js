import { vec3 } from 'gl-matrix';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkPointSet from 'vtk.js/Sources/Common/DataModel/PointSet';

/**
 *
 */
interface IPolyDataInitialValues {
}


export interface vtkPolyData extends vtkPointSet {

	/**
	 * Create data structure that allows random access of cells.
	 */
	buildCells(): void;

	/**
	 * Create upward links from points to cells that use each point. Enables
	 * topologically complex queries.
	 * @param initialSize {number}
	 */
	buildLinks(initialSize?: number): void;

	/**
	 * If you know the type of cell, you may provide it to improve performances.
	 * @param cellId
	 * @param cellHint
	 */
	getCell(cellId: any, cellHint: any): void;

	/**
	 * Get the neighbors at an edge.
	 * @param cellId
	 * @param point1
	 * @param point2
	 */
	getCellEdgeNeighbors(cellId: any, point1: any, point2: any): void;

	/**
	 * Get a list of point ids that define a cell.
	 * @param cellId {number}
	 * @returns an object made of the cellType and a subarray `cellPointIds` of the cell points.
	 */
	getCellPoints(cellId: number): object;

	/**
	 * Get the cell array defining cells.
	 */
	getCells(): vtkCellArray;

	/**
	 * Get the cell array defining lines.
	 */
	getLines(): vtkCellArray;

	/**
	 *
	 */
	getLinks(): any;

	/**
	 * Determine the number of cells composing the polydata.
	 */
	getNumberOfCells(): number;

	/**
	 * Determine the number of lines composing the polydata.
	 */
	getNumberOfLines(): number;

	/**
	 * Determine the number of points composing the polydata.
	 */
	getNumberOfPoints(): number;

	/**
	 * Determine the number of polys composing the polydata.
	 */
	getNumberOfPolys(): number;

	/**
	 * Determine the number of strips composing the polydata.
	 */
	getNumberOfStrips(): number;

	/**
	 * Determine the number of vertices composing the polydata.
	 */
	getNumberOfVerts(): number;

	/**
	 * Topological inquiry to get cells using point.
	 * @param ptId
	 */
	getPointCells(ptId: any): void;

	/**
	 * Get the cell array defining polys. 
	 */
	getPolys(): vtkCellArray;

	/**
	 * Get the cell array defining strips.
	 */
	getStrips(): vtkCellArray;

	/**
	 * Get the cell array defining vertices. If there are no vertices, an empty
	 * array will be returned (convenience to simplify traversal).
	 */
	getVerts(): vtkCellArray;

	/**
	 * Set the cell array defining lines. 
	 * @param lines {vtkCellArray}
	 */
	setLines(lines: vtkCellArray): boolean;

	/**
	 * Set the cell array defining polys. 
	 * @param polys {vtkCellArray}
	 */
	setPolys(polys: vtkCellArray): boolean;

	/**
	 * Set the cell array defining strips. 
	 * @param strips {vtkCellArray}
	 */
	setStrips(strips: vtkCellArray): boolean;

	/**
	 * Set the cell array defining vertices.
	 * @param verts {vtkCellArray}
	 */
	setVerts(verts: vtkCellArray): boolean;
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
