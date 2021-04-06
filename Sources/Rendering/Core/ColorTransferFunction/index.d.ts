import { VtkObject } from "vtk.js/Sources/macro";

export enum ColorSpace {
	RGB,
	HSV,
	LAB,
	DIVERGING,
}

export enum Scale {
	LINEAR,
	LOG10,
}

/* TODO: use VtkScalarsToColors instead of VtkObject */
export interface vtkColorTransferFunction extends VtkObject {

	/**
	 * Add a point defined in RGB
	 * @param {number} x
	 * @param {number} r
	 * @param {number} g
	 * @param {number} b
	 */
	addRGBPoint(x: number, r: number, g: number, b: number): number;

	/**
	 * Add a point defined in RGB
	 * @param {number} x
	 * @param {number} r
	 * @param {number} g
	 * @param {number} b
	 * @param midpoint
	 * @param sharpness
	 */
	addRGBPointLong(x: number, r: number, g: number, b: number, midpoint: number, sharpness: number): number;

	/**
	 * Add a point defined in HSV
	 * @param {number} x
	 * @param {number} h
	 * @param {number} s
	 * @param {number} v
	 */
	addHSVPoint(x: number, h: number, s: number, v: number): number;

	/**
	 * Add a line defined in RGB
	 * @param {number} x1
	 * @param {number} r1
	 * @param {number} g1
	 * @param {number} b1
	 * @param {number} x2
	 * @param {number} r2
	 * @param {number} g2
	 * @param {number} b2
	 */
	addRGBSegment(x1: number, r1: number, g1: number, b1: number, x2: number, r2: number, g2: number, b2: number): void;

	/**
	 * Add a line defined in HSV
	 * @param {number} x1
	 * @param {number} h1
	 * @param {number} s1
	 * @param {number} v1
	 * @param {number} x2
	 * @param {number} h2
	 * @param {number} s2
	 * @param {number} v2
	 */
	addHSVSegment(x1: number, h1: number, s1: number, v1: number, x2: number, h2: number, s2: number, v2: number): void;


	/**
	 * Add a point defined in HSV
	 * @param {number} x
	 * @param {number} h
	 * @param {number} s
	 * @param {number} v
	 * @param {number} midpoint
	 * @param {number} sharpness
	 */
	addHSVPointLong(x: number, h: number, s: number, v: number, midpoint: number, sharpness: number): number;

    /**
	 * Return the number of points which specify this function
	 */
	getSize(): number;

	/**
	 * Set nodes directly
	 * @param nodes
	 */
	setNodes(nodes: any): void;

	/**
	 * Sort the vector in increasing order, then fill in
	 * the Range
	 */
	sortAndUpdateRange(): void;

	/**
	 *
	 */
	updateRange(): boolean;

	/**
	 * Remove a point
	 * @param {number} x
	 */
	removePoint(x: number): number;

	/**
	 * @param {number} oldX
	 * @param {number} newX
	 */
	movePoint(oldX: number, newX: number): void;

	/**
	 * Remove all points
	 */
	removeAllPoints(): void;

	/**
	 * Returns the RGBA color evaluated at the specified location
	 * @param {number} x
	 */
	mapValue(x: number): any;

	/**
	 * Returns the RGB color evaluated at the specified location
	 * @param {number} x 
	 * @param {number[]} rgb 
	 */
	getColor(x: number, rgb: number[]): void;
		
	/**
	 * Returns the red color evaluated at the specified location
	 * @param {number} x
	 */
	getRedValue(x: number): number;

	/**
	 * Returns the green color evaluated at the specified location
	 * @param {number} x
	 */
	getGreenValue(x: number): number;

	/**
	 * Returns the blue color evaluated at the specified location
	 * @param {number} x
	 */
	getBlueValue(x: number): number;

	/**
	 * Returns a table of RGB colors at regular intervals along the function
	 * @param {number} xStart
	 * @param {number} xEnd
	 * @param {number} size
	 * @param {number[]} table
	 */
	getTable(xStart: number, xEnd: number, size: number, table: number[]): void;

	/**
	 * @param {number} xStart
	 * @param {number} xEnd
	 * @param {number} size
	 * @param {boolean} withAlpha
	 */
	getUint8Table(xStart: number, xEnd: number, size: number, withAlpha: boolean): Float32Array;

	/**
	 * @param {number} xStart
	 * @param {number} xEnd
	 * @param {number} size
	 * @param {number[]} table
	 */
	buildFunctionFromTable(xStart: any, xEnd: any, size: number, table: number[]): void;

	/**
	 * For a specified index value, get the node parameters
	 * @param {number} index
	 * @param {number[]} val
	 */
	getNodeValue(index: number, val: number[]): number;

	/**
	 * For a specified index value, get the node parameters
	 * @param {number} index
	 * @param {number[]} val
	 */
	setNodeValue(index: number, val: number[]): number;

	/**
	 */
	getNumberOfAvailableColors(): number;

	/**
	 * @param idx
	 * @param {number[]} rgba 
	 */
	getIndexedColor(idx: any, rgba: number[]): void;
		
	/**
	 * @param nb
	 * @param ptr
	 */
	fillFromDataPointer(nb: any, ptr: any): void;

	/**
	 * @param {number} min
	 * @param {number} max
	 */
	setMappingRange(min: number, max: number): void;

	/**
	 * @param {number[]} range 
	 */
	adjustRange(range: number[]): number;
		
	/**
	 * --------------------------------------------------------------------------
	 * @param {number} x1
	 * @param {number} x2
	 */
	estimateMinNumberOfSamples(x1: any, x2: any): number;

	/**
	 */
	findMinimumXDistance(): number;

	/**
	 *
	 * @param input
	 * @param output
	 * @param outFormat
	 * @param inputOffset
	 */
	mapScalarsThroughTable(input: any, output: any, outFormat: any, inputOffset: any): void;

	/**
	 * @param input
	 * @param output
	 * @param outFormat
	 * @param inputOffset
	 */
	mapData(input: any, output: any, outFormat: any, inputOffset: any): void;

	/**
	 * @param colorMap
	 */
	applyColorMap(colorMap: any): void;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkColorTransferFunction characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param initialValues (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: object): void;

/**
 * Method use to create a new instance of vtkColorTransferFunction
 * @param initialValues for pre-setting some of its content
 */
export function newInstance(initialValues?: object): vtkColorTransferFunction;

/**
 * vtkColorTransferFunction is a color mapping in RGB or HSV space that
 * uses piecewise hermite functions to allow interpolation that can be
 * piecewise constant, piecewise linear, or somewhere in-between
 * (a modified piecewise hermite function that squishes the function
 * according to a sharpness parameter). The function also allows for
 * the specification of the midpoint (the place where the function
 * reaches the average of the two bounding nodes) as a normalize distance
 * between nodes.
 * See the description of class vtkPiecewiseFunction for an explanation of
 * midpoint and sharpness.
 *
 * @example
 * ```js
 * // create color transfer function
 * const ctfun = vtkColorTransferFunction.newInstance();
 * ctfun.addRGBPoint(200.0, 1.0, 1.0, 1.0);
 * ctfun.addRGBPoint(2000.0, 0.0, 0.0, 0.0);
 * ```
 */

export declare const vtkColorTransferFunction: {
    newInstance: typeof newInstance,
    extend: typeof extend,
};
export default vtkColorTransferFunction;
