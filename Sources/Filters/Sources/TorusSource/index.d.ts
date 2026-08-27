import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import { Vector3 } from '../../../types';

/**
 *
 */
export interface ITorusSourceInitialValues {
  radius?: number;
  tubeRadius?: number;
  resolution?: number;
  tubeResolution?: number;
  arcLength?: number;
  center?: Vector3;
  direction?: Vector3;
  pointType?: string;
}

type vtkTorusSourceBase = vtkObject &
  Omit<
    vtkAlgorithm,
    | 'getInputData'
    | 'setInputData'
    | 'setInputConnection'
    | 'getInputConnection'
    | 'addInputConnection'
    | 'addInputData'
  >;

export interface vtkTorusSource extends vtkTorusSourceBase {
  /**
   * Get the angle in radians swept by the torus around its axis.
   * @default 2 * Math.PI
   */
  getArcLength(): number;

  /**
   * Get the center of the torus.
   * @default [0, 0, 0]
   */
  getCenter(): Vector3;

  /**
   * Get the center of the torus.
   */
  getCenterByReference(): Vector3;

  /**
   * Get the orientation vector of the torus.
   * @default [1.0, 0.0, 0.0]
   */
  getDirection(): Vector3;

  /**
   * Get the orientation vector of the torus.
   */
  getDirectionByReference(): Vector3;

  /**
   * Get the radius from the center of the torus to the center of the tube.
   * @default 0.5
   */
  getRadius(): number;

  /**
   * Get the number of subdivisions along the arc of the torus.
   * @default 64
   */
  getResolution(): number;

  /**
   * Get the radius of the tube.
   * @default 0.01
   */
  getTubeRadius(): number;

  /**
   * Get the number of subdivisions around the tube section.
   * @default 64
   */
  getTubeResolution(): number;

  /**
   * Expose methods
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;

  /**
   * Set the angle in radians swept by the torus around its axis.
   * @param {Number} arcLength
   */
  setArcLength(arcLength: number): boolean;

  /**
   * Set the center of the torus.
   * @param {Number} x The x coordinate.
   * @param {Number} y The y coordinate.
   * @param {Number} z The z coordinate.
   */
  setCenter(x: number, y: number, z: number): boolean;

  /**
   * Set the center of the torus.
   * @param {Vector3} center
   */
  setCenter(center: Vector3): boolean;

  /**
   * Set the center of the torus.
   * @param {Vector3} center
   */
  setCenterFrom(center: Vector3): void;

  /**
   * Set the direction for the torus.
   * @param {Number} x The x coordinate.
   * @param {Number} y The y coordinate.
   * @param {Number} z The z coordinate.
   */
  setDirection(x: number, y: number, z: number): boolean;

  /**
   * Set the direction for the torus.
   * @param {Vector3} direction
   */
  setDirection(direction: Vector3): boolean;

  /**
   * Set the direction for the torus.
   * @param {Vector3} direction
   */
  setDirectionFrom(direction: Vector3): void;

  /**
   * Set the radius from the center of the torus to the center of the tube.
   * @param {Number} radius
   */
  setRadius(radius: number): boolean;

  /**
   * Set the number of subdivisions along the arc of the torus.
   * @param {Number} resolution
   */
  setResolution(resolution: number): boolean;

  /**
   * Set the radius of the tube.
   * @param {Number} tubeRadius
   */
  setTubeRadius(tubeRadius: number): boolean;

  /**
   * Set the number of subdivisions around the tube section.
   * @param {Number} tubeResolution
   */
  setTubeResolution(tubeResolution: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkTorusSource characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ITorusSourceInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ITorusSourceInitialValues
): void;

/**
 * Method used to create a new instance of vtkTorusSource.
 * @param {ITorusSourceInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: ITorusSourceInitialValues
): vtkTorusSource;

/**
 * vtkTorusSource creates a torus centered at a specified point and whose axis
 * points in a specified direction. The torus is defined by the radius from its
 * center to the center of the tube, the radius of the tube itself, and the arc
 * length swept around the axis, which allows partial tori to be created.
 *
 * @example
 * ```js
 * import vtkTorusSource from '@kitware/vtk.js/Filters/Sources/TorusSource';
 *
 * const torus = vtkTorusSource.newInstance({ radius: 1, tubeRadius: 0.1 });
 * const polydata = torus.getOutputData();
 * ```
 */
export declare const vtkTorusSource: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkTorusSource;
