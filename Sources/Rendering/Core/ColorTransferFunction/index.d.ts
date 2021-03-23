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
	 * @param x 
	 * @param r 
	 * @param g 
	 * @param b 
	 */
	addRGBPoint(x: number, r: number, g: number, b: number): number;

	/**
	 * Add a point defined in RGB
	 * @param x 
	 * @param r 
	 * @param g 
	 * @param b 
	 * @param midpoint 
	 * @param sharpness 
	 */
	addRGBPointLong(x: number, r: number, g: number, b: number, midpoint: number, sharpness: number): number;

	/**
	 * Add a point defined in HSV
	 * @param x 
	 * @param h 
	 * @param s 
	 * @param v 
	 */
	addHSVPoint(x: number, h: number, s: number, v: number): number;

	/**
	 * Add a line defined in RGB
	 * @param x1 
	 * @param r1 
	 * @param g1 
	 * @param b1 
	 * @param x2 
	 * @param r2 
	 * @param g2 
	 * @param b2 
	 */
	addRGBSegment(x1: number, r1: number, g1: number, b1: number, x2: number, r2: number, g2: number, b2: number): void;
		
	/**
	 * Add a line defined in HSV
	 * @param x1 
	 * @param h1 
	 * @param s1 
	 * @param v1 
	 * @param x2 
	 * @param h2 
	 * @param s2 
	 * @param v2 
	 */
	addHSVSegment(x1: number, h1: number, s1: number, v1: number, x2: number, h2: number, s2: number, v2: number): void;
		
		
	/**
	 * Add a point defined in HSV
	 * @param x 
	 * @param h 
	 * @param s 
	 * @param v 
	 * @param midpoint 
	 * @param sharpness 
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
	 * @param x 
	 */
	removePoint(x: any): number;
		
	/**
	 * @param oldX 
	 * @param newX 
	 */
	movePoint(oldX: any, newX: any): void;
		
	/**
	 * Remove all points
	 */
	removeAllPoints(): void;

	/**
	 * Returns the RGBA color evaluated at the specified location
	 * @param x 
	 */
	mapValue(x: number): any;
		
	/**
	 * Returns the RGB color evaluated at the specified location
	 * @param x 
	 * @param rgb 
	 */
	getColor(x: number, rgb: number[]): void;
		
	/**
	 * Returns the red color evaluated at the specified location
	 * @param x 
	 */
	getRedValue(x: number): number;
		
	/**
	 * Returns the green color evaluated at the specified location
	 * @param x 
	 */
	getGreenValue(x: number): number;
		
	/**
	 * Returns the blue color evaluated at the specified location
	 * @param x 
	 */
	getBlueValue(x: number): number;
		
	/**
	 * Returns a table of RGB colors at regular intervals along the function
	 * @param xStart 
	 * @param xEnd 
	 * @param size 
	 * @param table 
	 */
	getTable(xStart: number, xEnd: number, size: number, table: number[]): void;
		
	/**
	 * @param xStart 
	 * @param xEnd 
	 * @param size 
	 * @param withAlpha 
	 */
	getUint8Table(xStart: number, xEnd: number, size: any, withAlpha: boolean): Float32Array;	

	/**
	 * @param xStart 
	 * @param xEnd 
	 * @param size 
	 * @param table 
	 */
	buildFunctionFromTable(xStart: any, xEnd: any, size: any, table: any): void;
		
	/**
	 * For a specified index value, get the node parameters
	 * @param index 
	 * @param val 
	 */
	getNodeValue(index: number, val: any): number;
		
	/**
	 * For a specified index value, get the node parameters
	 * @param index 
	 * @param val 
	 */
	setNodeValue(index: any, val: any): number;
		
	/**
	 */
	getNumberOfAvailableColors(): number;
		
	/**
	 * @param idx 
	 * @param rgba 
	 */
	getIndexedColor(idx: any, rgba: any): void;
		
	/**
	 * @param nb 
	 * @param ptr 
	 */
	fillFromDataPointer(nb: any, ptr: any): void;
		
	/**
	 * @param min 
	 * @param max 
	 */
	setMappingRange(min: any, max: any): void;
		
	/**
	 * @param range 
	 */
	adjustRange(range: any): number;
		
	/**
	 * --------------------------------------------------------------------------
	 * @param x1 
	 * @param x2 
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
 * @see vtkPiecewiseFunction
 */

export declare const vtkColorTransferFunction: {
    newInstance: typeof newInstance,
    extend: typeof extend,
};
export default vtkColorTransferFunction;
