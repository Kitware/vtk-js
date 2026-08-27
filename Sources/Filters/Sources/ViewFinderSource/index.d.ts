import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import { Vector3 } from '../../../types';

/**
 *
 */
export interface IViewFinderSourceInitialValues {
  radius?: number;
  spacing?: number;
  width?: number;
  center?: Vector3;
  orientation?: Vector3;
  pointType?: string;
}

type vtkViewFinderSourceBase = vtkObject &
  Omit<
    vtkAlgorithm,
    | 'getInputData'
    | 'setInputData'
    | 'setInputConnection'
    | 'getInputConnection'
    | 'addInputConnection'
    | 'addInputData'
  >;

export interface vtkViewFinderSource extends vtkViewFinderSourceBase {
  /**
   * Get the center of the view finder.
   * @default [0, 0, 0]
   */
  getCenter(): Vector3;

  /**
   * Get the center of the view finder.
   */
  getCenterByReference(): Vector3;

  /**
   * Get the orientation vector of the view finder.
   * @default [1, 0, 0]
   */
  getOrientation(): Vector3;

  /**
   * Get the orientation vector of the view finder.
   */
  getOrientationByReference(): Vector3;

  /**
   * Get the distance from the center at which each bar starts.
   * @default 1
   */
  getRadius(): number;

  /**
   * Get the length of each bar.
   * @default 2
   */
  getSpacing(): number;

  /**
   * Get the ratio between the radius and the half-thickness of each bar.
   * A larger value produces thinner bars.
   * @default 4
   */
  getWidth(): number;

  /**
   * Expose methods
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;

  /**
   * Set the center of the view finder.
   * @param {Number} x The x coordinate.
   * @param {Number} y The y coordinate.
   * @param {Number} z The z coordinate.
   */
  setCenter(x: number, y: number, z: number): boolean;

  /**
   * Set the center of the view finder.
   * @param {Vector3} center
   */
  setCenter(center: Vector3): boolean;

  /**
   * Set the center of the view finder.
   * @param {Vector3} center
   */
  setCenterFrom(center: Vector3): void;

  /**
   * Set the orientation for the view finder.
   * @param {Number} x The x coordinate.
   * @param {Number} y The y coordinate.
   * @param {Number} z The z coordinate.
   */
  setOrientation(x: number, y: number, z: number): boolean;

  /**
   * Set the orientation for the view finder.
   * @param {Vector3} orientation
   */
  setOrientation(orientation: Vector3): boolean;

  /**
   * Set the orientation for the view finder.
   * @param {Vector3} orientation
   */
  setOrientationFrom(orientation: Vector3): void;

  /**
   * Set the distance from the center at which each bar starts.
   * @param {Number} radius
   */
  setRadius(radius: number): boolean;

  /**
   * Set the length of each bar.
   * @param {Number} spacing
   */
  setSpacing(spacing: number): boolean;

  /**
   * Set the ratio between the radius and the half-thickness of each bar.
   * @param {Number} width
   */
  setWidth(width: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkViewFinderSource characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IViewFinderSourceInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IViewFinderSourceInitialValues
): void;

/**
 * Method used to create a new instance of vtkViewFinderSource.
 * @param {IViewFinderSourceInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IViewFinderSourceInitialValues
): vtkViewFinderSource;

/**
 * vtkViewFinderSource creates a view finder: four pairs of bars laid out along
 * the axes of a plane, leaving the center free so that the crosshair marks a
 * position without hiding it. The bars start at `radius` from the center, are
 * `spacing` long, and their thickness is derived from `radius / width`.
 *
 * @example
 * ```js
 * import vtkViewFinderSource from '@kitware/vtk.js/Filters/Sources/ViewFinderSource';
 *
 * const viewFinder = vtkViewFinderSource.newInstance({ radius: 1, spacing: 2 });
 * const polydata = viewFinder.getOutputData();
 * ```
 */
export declare const vtkViewFinderSource: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkViewFinderSource;
