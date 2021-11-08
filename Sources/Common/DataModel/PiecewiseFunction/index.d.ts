import { vtkObject } from "../../../interfaces" ;
import { Range } from "../../../types";

export interface IPiecewiseFunctionInitialValues {
	range?: Range,
	clamping?: boolean,
	allowDuplicateScalars?: boolean,
}

export interface vtkPiecewiseFunction extends vtkObject {

	/**
	 * Add points to the function.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 */
	addPoint(x: number, y: number): void;

	/**
	 * Add points to the function.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} midpoint 
	 * @param {Number} sharpness 
	 */
	addPointLong(x: number, y: number, midpoint: number, sharpness: number): number;

	/**
	 * Add a line segment to the function.
	 * @param {Number} x1 The first point x coordinate.
	 * @param {Number} y1 The first point y coordinate.
	 * @param {Number} x2 The second point x coordinate.
	 * @param {Number} y2 The second point y coordinate.
	 */
	addSegment(x1: number, y1: number, x2: number, y2: number): void;

	/**
	 * Remove all points out of the new range, and make sure there is a point at
	 * each end of that range.
	 * @param {Range} range 
	 */
	adjustRange(range: Range): number;

	/**
	 * Estimates the minimum size of a table such that it would correctly sample
	 * this function.
	 */
	estimateMinNumberOfSamples(): number;

	/**
	 * Traverses the nodes to find the minimum distance.
	 */
	findMinimumXDistance(): number;

	/**
	 * Toggle whether to allow duplicate scalar values in the piecewise function
	 * (off by default).
	 */
	getAllowDuplicateScalars(): boolean;

	/**
	 * When zero range clamping is Off, GetValue() returns 0.0 when a value is
	 * requested outside of the points specified. 
	 *
	 * When zero range clamping is On, GetValue() returns the value at the value
	 * at the lowest point for a request below all points specified and returns
	 * the value at the highest point for a request above all points specified.
	 * On is the default.
	 */
	getClamping(): boolean;

	/**
	 * Returns a pointer to the data stored in the table.
	 */
	getDataPointer(): any[];

	/**
	 * Returns the first point location which precedes a non-zero segment of the
	 * function.
	 */
	getFirstNonZeroValue(): number;

	/**
	 * For the node specified by index, set/get the location (X), value (Y),
	 * midpoint, and sharpness values at the node.
	 * @param {Number} index 
	 * @param val 
	 */
	getNodeValue(index: number, val: any[]): void;

	/**
	 * Returns the min and max node locations of the function.
	 */
	getRange(): Range;

	/**
	 * Returns the min and max node locations of the function.
	 */
	getRangeByReference(): Range;

	/**
	 * Get the number of points used to specify the function.
	 */
	getSize(): number;

	/**
	 * Fills in an array of function values evaluated at regular intervals.
	 * @param {Number} xStart 
	 * @param {Number} xEnd 
	 * @param {Number} size 
	 * @param table 
	 * @param {Number} [stride] 
	 */
	getTable(xStart: number, xEnd: number, size: number, table: any, stride?: number): void;

	/**
	 * Return the type of function: Function Types: 
	 * * 0 : Constant (No change in slope between end points)
	 * * 1 : NonDecreasing (Always increasing or zero slope) 
	 * * 2 : NonIncreasing (Always decreasing or zero slope) 
	 * * 3 : Varied (Contains both decreasing and increasing slopes)
	 */
	getType(): 'Constant' | 'NonDecreasing' | 'NonIncreasing' | 'Varied';

	/**
	 * Returns the value of the function at the specified location using the
	 * specified interpolation.
	 */
	getValue(): any;

	/**
	 * Removes all points from the function.
	 */
	removeAllPoints(): void;

	/**
	 * Remove the first point found at the given x location Return the index of
	 * the remove point if any, -1 otherwise.
	 * @param {Number} x 
	 */
	removePoint(x: number): number;

	/**
	 * 
	 * @param {Boolean} allowDuplicateScalars 
	 */
	setAllowDuplicateScalars(allowDuplicateScalars: boolean): boolean;

	/**
	 * When zero range clamping is Off, GetValue() returns 0.0 when a value is
	 * requested outside of the points specified. 
	 * 
	 * When zero range clamping is On, GetValue() returns the value at the value
	 * at the lowest point for a request below all points specified and returns
	 * the value at the highest point for a request above all points specified.
	 * On is the default.
	 * @param {Boolean} clamping 
	 */
	setClamping(clamping: boolean): boolean;

	/**
	 * 
	 * @param {Number} index 
	 * @param val 
	 */
	setNodeValue(index: number, val: any[]): number; 

	/**
	 * 
	 * @param nodes 
	 */
	setNodes(nodes: any[]): void;

	/**
	 * 
	 * @param {Range} range 
	 */
	setRange(range: Range): boolean;

	/**
	 * 
	 * @param {Number} min 
	 * @param {Number} max 
	 */
	setRange(min: number, max: number): boolean;

	/**
	 * 
	 * @param {Range} range 
	 */
	setRangeFrom(range: Range): boolean;

	/**
	 * Internal method to sort the vector and update the Range whenever a node
	 * is added, edited or removed.

	 */
	sortAndUpdateRange(): void;

	/**
	 * Returns true if the range has been updated and Modified() has been
	 * called.
	 */
	updateRange(): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkPiecewiseFunction characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IPiecewiseFunctionInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IPiecewiseFunctionInitialValues): void;

/**
 * Method used to create a new instance of vtkPiecewiseFunction.
 * @param {IPiecewiseFunctionInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IPiecewiseFunctionInitialValues): vtkPiecewiseFunction;

/**
 * vtkPiecewiseFunction Defines a piecewise function mapping. This mapping
 * allows the addition of control points, and allows the user to control the
 * function between the control points. A piecewise hermite curve is used
 * between control points, based on the sharpness and midpoint parameters. A
 * sharpness of 0 yields a piecewise linear function and a sharpness of 1 yields
 * a piecewise constant function. The midpoint is the normalized distance
 * between control points at which the curve reaches the median Y value.
 *
 * The midpoint and sharpness values specified when adding a node are used to
 * control the transition to the next node (the last node's values are ignored)
 * Outside the range of nodes, the values are 0 if Clamping is off, or the
 * nearest node point if Clamping is on. Using the legacy methods for adding
 * points  (which do not have Sharpness and Midpoint parameters) will default to
 * Midpoint = 0.5 (halfway between the control points) and Sharpness = 0.0
 * (linear).
 * 
 * @example
 * ```js
 * const ofun = vtkPiecewiseFunction.newInstance();
 * ofun.addPoint(200.0, 0.0);
 * ofun.addPoint(1200.0, 0.2);
 * ofun.addPoint(4000.0, 0.4);
 * ```
 * 
 * @see [vtkColorTransferFunction](./Rendering_Core_ColorTransferFunction.html)
 */
export declare const vtkPiecewiseFunction: {
	newInstance: typeof newInstance,
	extend: typeof extend;
};
export default vtkPiecewiseFunction;
