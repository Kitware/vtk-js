import { VtkDataArray } from '../../../macro';


export interface VtkPoints extends VtkDataArray {
  /**
   * Return the number of points which is the same as returning the number of tuples
   */
  getNumberOfPoints(): number;

  /**
   * Allocate if needed the proper TypedArray so it could be filled afterward
   * by calling something like below:
   *
   * ```
   * points.getData()[0] = x;
   * points.getData()[1] = y;
   * points.getData()[2] = z;
   * // ...
   * ```
   */
  setNumberOfPoints(numberOfPoints: number, dimension?: number): void;

  /**
   * Set the (x,y,z) coordinate of a point based on its index (0, 1, 2, ...)
   * @param idx point index to replace
   * @param xyz coordinates to use
   */
  setPoint(idx: number, ...xyz: Array<number>): void;

  /**
   * Return the xyz of a point
   * @param idx point index to retrieve
   * @param tupleToFill (default [])
   */
  getPoint(idx: number, tupleToFill?: Array<number>): Array<number>;

  /**
   * Return the bounds of the xyz coordinates in the following form
   *
   * ```
   * const bounds = [
   *   minX, maxX,
   *   minY, maxY,
   *   minZ, maxZ
   * ];
   * ```
   */
  getBounds(): Array<number>;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkPoints characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param initialValues (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: object): void;

/**
 * Method use to create a new instance of VtkPoints
 * @param initialValues for pre-setting some of its content
 */
export function newInstance(initialValues?: object): VtkPoints;

declare const vtkPoints: {
  newInstance: typeof newInstance,
  extend: typeof extend,
};

export default vtkPoints;
