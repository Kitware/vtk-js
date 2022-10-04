import { CellType, Vector3 } from '../../../types';
import vtkCellArray from '../../Core/CellArray';
import vtkPointSet, { IPointSetInitialValues } from '../PointSet';

/**
 *
 */
export interface IPolyDataInitialValues extends IPointSetInitialValues {
}


export interface vtkPolyData extends vtkPointSet {

	/**
	 * Create data structure that allows random access of cells.
	 */
	buildCells(): void;

	/**
	 * Create upward links from points to cells that use each point. Enables
	 * topologically complex queries.
	 * @param {Number} initialSize 
	 */
	buildLinks(initialSize?: number): void;

	/**
	 * If you know the type of cell, you may provide it to improve performances.
	 * @param {Number} cellId 
	 * @param cellHint 
	 */
	getCell(cellId: number, cellHint: any): void;

	/**
	 * Get the neighbors at an edge.
	 * @param {Number} cellId The Id of the cell.
	 * @param {Vector3} point1 The first point coordinate.
	 * @param {Vector3} point2 The second point coordinate.
	 */
	getCellEdgeNeighbors(cellId: number, point1: Vector3, point2: Vector3): void;

	/**
	 * Get a list of point ids that define a cell.
	 * @param {Number} cellId The Id of the cell.
	 * @return an object made of the cellType and a subarray `cellPointIds` of the cell points.
	 */
	getCellPoints(cellId: number): object;

	/**
	 * Get the type of the cell
	 * @param {Number} cellId The Id of the cell.
	 * @return CellType The type of the cell.
	 */
	 getCellType(cellId: number): CellType;

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
	 * Get the cell array defining vertices.
	 * If there are no vertices, an empty array will be returned (convenience to
	 * simplify traversal).
	 */
	getVerts(): vtkCellArray;

	/**
	 * Set the cell array defining lines. 
	 * @param {vtkCellArray} lines The cell array defining lines.
	 */
	setLines(lines: vtkCellArray): boolean;

	/**
	 * Set the cell array defining polys. 
	 * @param {vtkCellArray} polys The cell array defining polys.
	 */
	setPolys(polys: vtkCellArray): boolean;

	/**
	 * Set the cell array defining strips. 
	 * @param {vtkCellArray} strips The cell array defining strips.
	 */
	setStrips(strips: vtkCellArray): boolean;

	/**
	 * Set the cell array defining vertices.
	 * @param {vtkCellArray} verts The cell array defining vertices.
	 */
	setVerts(verts: vtkCellArray): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkPolyData characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IPolyDataInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IPolyDataInitialValues): void;

/**
 * Method used to create a new instance of vtkPolyData.
 * @param {IPolyDataInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IPolyDataInitialValues): vtkPolyData;

/**
 * vtkPolyData is a dataset that represents a geometric structure consisting of vertices, lines, polygons, and/or strips.
 */
export declare const vtkPolyData: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkPolyData;
