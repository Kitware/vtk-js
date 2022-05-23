import { vtkObject } from '../../../interfaces';
import { ColorSpace, Scale } from "./Constants";


/* TODO: use VtkScalarsToColors instead of VtkObject */
export interface vtkColorTransferFunction extends vtkObject {
  /**
   * Add a point defined in RGB
   * @param {Number} x The index of the point.
   * @param {Number} r Defines the red component (between 0 and 1).
   * @param {Number} g Defines the green component (between 0 and 1).
   * @param {Number} b Defines the blue component (between 0 and 1).
   */
  addRGBPoint(x: number, r: number, g: number, b: number): number;

  /**
   * Add a point defined in RGB
   * @param {Number} x The index of the point.
   * @param {Number} r Defines the red component (between 0 and 1).
   * @param {Number} g Defines the green component (between 0 and 1).
   * @param {Number} b Defines the blue component (between 0 and 1).
   * @param {Number} [midpoint]
   * @param {Number} [sharpness]
   */
  addRGBPointLong(
    x: number,
    r: number,
    g: number,
    b: number,
    midpoint?: number,
    sharpness?: number
  ): number;

  /**
   * Add a point defined in HSV
   * @param {Number} x The index of the point.
   * @param {Number} h Defines the hue of the color (between 0 and 1).
   * @param {Number} s Defines the saturation of the color (between 0 and 1).
   * @param {Number} v Defines the value of the color (between 0 and 1).
   */
  addHSVPoint(x: number, h: number, s: number, v: number): number;

  /**
   * Add a line defined in RGB
   * @param {Number} x1 The index of the first point.
   * @param {Number} r1 Defines the red component of the first point(between 0 and 1).
   * @param {Number} g1 Defines the green component of the first point(between 0 and 1).
   * @param {Number} b1 Defines the red component of the first point (between 0 and 1).
   * @param {Number} x2 The index of the second point.
   * @param {Number} r2 Defines the red component of the second point (between 0 and 1).
   * @param {Number} g2 Defines the green component of the second point (between 0 and 1).
   * @param {Number} b2 Defines the blue component of the second point (between 0 and 1).
   */
  addRGBSegment(
    x1: number,
    r1: number,
    g1: number,
    b1: number,
    x2: number,
    r2: number,
    g2: number,
    b2: number
  ): void;

  /**
   * Add a line defined in HSV
   * @param {Number} x1 The index of the first point.
   * @param {Number} h1 Defines the hue of the color of the first point (between 0 and 1).
   * @param {Number} s1 Defines the saturation of the color of the first point (between 0 and 1).
   * @param {Number} v1 Defines the value of the color of the first point (between 0 and 1).
   * @param {Number} x2 The index of the second point.
   * @param {Number} h2 Defines the hue of the colorof the second point (between 0 and 1).
   * @param {Number} s2 Defines the saturation of the color of the second point (between 0 and 1).
   * @param {Number} v2 Defines the value of the color of the second point (between 0 and 1).
   */
  addHSVSegment(
    x1: number,
    h1: number,
    s1: number,
    v1: number,
    x2: number,
    h2: number,
    s2: number,
    v2: number
  ): void;

  /**
   * Add a point defined in HSV
   * @param {Number} x The index of the point.
   * @param {Number} h Defines the hue of the color (between 0 and 1).
   * @param {Number} s Defines the saturation of the color (between 0 and 1).
   * @param {Number} v Defines the value of the color (between 0 and 1).
   * @param {Number} [midpoint]
   * @param {Number} [sharpness]
   */
  addHSVPointLong(
    x: number,
    h: number,
    s: number,
    v: number,
    midpoint?: number,
    sharpness?: number
  ): number;

  /**
   * Get the number of points which specify this function
   */
  getSize(): number;

  /**
   * Set nodes directly
   * @param nodes
   *
   * @returns true if a change happen
   */
  setNodes(nodes: any): boolean;

  /**
   * Sort the vector in increasing order, then fill in
   * the Range
   *
   * @returns true if a change happen
   */
  sortAndUpdateRange(): boolean;

  /**
   * @returns true if a change happen
   */
  updateRange(): boolean;

  /**
   * Remove a point
   * @param {Number} x The index of the point.
   */
  removePoint(x: number): number;

  /**
   * Moves point from oldX to newX.
   *
   * It removed the point from oldX. If any point existed at newX, it will also be removed.
   * @param {Number} oldX The old index of the point.
   * @param {Number} newX The new index of the point.
   */
  movePoint(oldX: number, newX: number): void;

  /**
   * Remove all points
   */
  removeAllPoints(): void;

  /**
   * Get the RGBA color evaluated at the specified location
   * @param {Number} x The index of the point.
   */
  mapValue(x: number): any;

  /**
   * Get the RGB color evaluated at the specified location
   * @param {Number} x The index of the point.
   * @param {Number[]} rgb The Array of the RGB color to fill.
   */
  getColor(x: number, rgb: number[]): void;

  /**
   * Get the red color evaluated at the specified location
   * @param {Number} x The index of the point.
   */
  getRedValue(x: number): number;

  /**
   * Get the green color evaluated at the specified location
   * @param {Number} x The index of the point.
   */
  getGreenValue(x: number): number;

  /**
   * Get the blue color evaluated at the specified location
   * @param {Number} x The index of the point.
   */
  getBlueValue(x: number): number;

  /**
   * Get a table of RGB colors at regular intervals along the function
   * @param {Number} xStart The index of the first point.
   * @param {Number} xEnd The index of the second point.
   * @param {Number} size
   * @param {Number[]} table
   */
  getTable(xStart: number, xEnd: number, size: number, table: number[]): void;

  /**
   * @param {Number} xStart The index of the first point.
   * @param {Number} xEnd The index of the first point.
   * @param {Number} size
   * @param {Boolean} withAlpha
   */
  getUint8Table(
    xStart: number,
    xEnd: number,
    size: number,
    withAlpha: boolean
  ): Float32Array;

  /**
   * Construct a color transfer function from a table.
   * @param {Number} xStart The index of the first point.
   * @param {Number} xEnd The index of the first point.
   * @param {Number} size
   * @param {Number[]} table
   */
  buildFunctionFromTable(
    xStart: number,
    xEnd: number,
    size: number,
    table: number[]
  ): void;

  /**
   * For the node specified by index, set/get the location (X), R, G, and B
   * values, midpoint, and sharpness values at the node.
   * @param {Number} index
   * @param {Number[]} val
   */
  getNodeValue(index: number, val: number[]): number;

  /**
   * For a specified index value, set the node parameters
   * @param {Number} index
   * @param {Number[]} val
   */
  setNodeValue(index: number, val: number[]): number;

  /**
   * Get the number of available colors for mapping to.
   */
  getNumberOfAvailableColors(): number;

  /**
   * Get the color given an integer index.
   * @param {Number} idx The index of the point.
   * @param {Number[]} rgba An Array of the RGBA color.
   */
  getIndexedColor(idx: number, rgba: number[]): void;

  /**
   * Defines the nodes from an array ptr with the layout [X1, R1, G1, B1, X2,
   * R2, G2, B2, ..., Xn, Rn, Gn, Bn] where n is the number of nodes.
   * @param {Number} nb
   * @param ptr
   */
  fillFromDataPointer(nb: number, ptr: any): void;

  /**
   * Set the range of scalars being mapped.
   * @param {Number} min
   * @param {Number} max
   */
  setMappingRange(min: number, max: number): void;

  /**
   * Remove all points out of the new range, and make sure there is a point at
   * each end of that range.
   * @param {Number[]} range
   */
  adjustRange(range: number[]): number;

  /**
   * Estimates the minimum size of a table such that it would correctly sample this function.
   * @param {Number} x1
   * @param {Number} x2
   */
  estimateMinNumberOfSamples(x1: number, x2: number): number;

  /**
   * Traverses the nodes to find the minimum distance.
   */
  findMinimumXDistance(): number;

  /**
   *
   * @param input
   * @param output
   * @param outFormat
   * @param inputOffset
   */
  mapScalarsThroughTable(
    input: any,
    output: any,
    outFormat: any,
    inputOffset: any
  ): void;

  /**
   * Map a set of scalars through the lookup table.
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
 * @param {object} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: object
): void;

/**
 * Method use to create a new instance of vtkColorTransferFunction
 * @param {object} [initialValues] for pre-setting some of its content
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
  newInstance: typeof newInstance;
  extend: typeof extend;
  ColorSpace: typeof ColorSpace;
  Scale: typeof Scale;
};
export default vtkColorTransferFunction;
