import { vtkAlgorithm, vtkObject } from "../../../interfaces";
import { Nullable, TypedArray, Vector3 } from "../../../types";
import vtkCellArray from "../../../Common/Core/CellArray";
import vtkPolyData from "../../../Common/DataModel/PolyData";
import vtkPoints from "../../../Common/Core/Points";

/**
 *
 */
export interface IContourTriangulatorInitialValues {
	triangulatePolys?: boolean;
}

type vtkContourTriangulatorBase = vtkObject & vtkAlgorithm;

export interface vtkContourTriangulator extends vtkContourTriangulatorBase {
	/**
	 *
	 * @param {any} inData
	 * @param {any} outData
	 */
	requestData(inData: any, outData: any): void;

	/**
	 * Sets the behavior of the filter regarding polys.
	 * @param {boolean} triangulate whether the filter should triangulate polys
	 * or leave them untouched. True by default
	 * @return {boolean} true if it changes
	 */
	setTriangulatePolys(triangulate: boolean): boolean;

	/**
	 * Returns the behavior of the filter regarding polys.
	 * @return {boolean} True if the filter triangulates polys, false otherwise.
	 */
	getTriangulatePolys(): boolean;
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

/**
 * This is a complex subroutine that takes a collection of lines that
 * were formed by cutting a polydata with a plane, and generates
 * a face that has those lines as its edges.  The lines must form one
 * or more closed contours, but they need not be sorted.
 *
 * Only "numLine" lines starting from "firstLine" are used to create new
 * polygons, and the new polygons are appended to "polys". The normal of
 * the cut plane must be provided so that polys will be correctly oriented.
 *
 * Given some closed contour lines, create a triangle mesh that fills
 * those lines. The input lines do not have to be in tail-to-tip order.
 * Only numLines starting from firstLine will be used. Note that holes
 * can be indicated by contour loops whose normals are in the opposite
 * direction to the provided normal.
 *
 * @param {vtkPolyData} polyData
 * @param {Number} firstLine
 * @param {Number} numLines
 * @param {vtkCellArray} polys
 * @param {Nullable<Vector3>} normal If null, the function will compute
 * the normal of the polys.
 * @param {Boolean} [triangulatePolys] (default: true) If set to true
 * the resulting polygons will be triangulated, otherwise the polygons
 * themselves will be added to the output.
 * @param {Boolean} [diagnoseOnTriangulationError] (default: false)
 * If this option is set to true and there was a triangulation error
 * this will add the polys as outlines to the output.
 * @returns {Boolean} Returns true if triangulation was successful,
 * false otherwise.
 */
export function triangulateContours(
	polyData: vtkPolyData,
	firstLine: number,
	numLines: number,
	polys: vtkCellArray,
	normal: Nullable<Vector3>,
	triangulatePolys?: boolean,
	diagnoseOnTriangulationError?: boolean
): boolean;

/**
 * A robust method for triangulating a polygon. It cleans up the polygon
 * and then applies the ear-cut triangulation. A zero return value
 * indicates that triangulation failed.
 *
 * @param {Array<Number>|TypedArray} polygon Array of point indices defining the polygon
 * @param {vtkPoints} points The point coordinates of the polygon
 * @param {vtkCellArray} triangles The cell array that is going to be
 * filled with the triangulation
 * @returns {Boolean} Returns true if triangulation was successful,
 * false otherwise.
 */
export function triangulatePolygon(
	polygon: Array<number> | TypedArray,
	points: vtkPoints,
	triangles: vtkCellArray
): boolean;

/**
 * Method use to decorate a given object (publicAPI+model) with vtkContourTriangulator characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IContourTriangulatorInitialValues} [initialValues] (default: {})
 */
export function extend(
	publicAPI: object,
	model: object,
	initialValues?: IContourTriangulatorInitialValues
): void;

// ----------------------------------------------------------------------------

/**
 * Method use to create a new instance of vtkContourTriangulator
 * @param {IContourTriangulatorInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
	initialValues?: IContourTriangulatorInitialValues
): vtkContourTriangulator;

/**
 * vtkContourTriangulator
 */
export declare const vtkContourTriangulator: {
	newInstance: typeof newInstance;
	extend: typeof extend;
	// static
	triangulateContours: typeof triangulateContours;
	triangulatePolygon: typeof triangulatePolygon;
};

export default vtkContourTriangulator;
