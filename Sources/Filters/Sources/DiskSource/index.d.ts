import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import { Vector3 } from '../../../types';

/**
 *
 */
export interface IDiskSourceInitialValues {
  innerRadius?: number;
  outerRadius?: number;
  center?: Vector3;
  normal?: Vector3;
  radialResolution?: number;
  circumferentialResolution?: number;
  pointType?: string;
}

type vtkDiskSourceBase = vtkObject &
  Omit<
    vtkAlgorithm,
    | 'getInputData'
    | 'setInputData'
    | 'setInputConnection'
    | 'getInputConnection'
    | 'addInputConnection'
    | 'addInputData'
  >;

export interface vtkDiskSource extends vtkDiskSourceBase {
  /**
   * Get the center of the disk.
   */
  getCenter(): Vector3;

  /**
   * Get the circumferential resolution of the disk.
   */
  getCircumferentialResolution(): number;

  /**
   * Get the inner radius of the disk.
   */
  getInnerRadius(): number;

  /**
   * Get the normal of the disk.
   */
  getNormal(): Vector3;

  /**
   * Get the outer radius of the disk.
   */
  getOuterRadius(): number;

  /**
   * Get the point type used for the disk.
   */
  getPointType(): string;

  /**
   * Get the radial resolution of the disk.
   */
  getRadialResolution(): number;

  /**
   * Expose methods
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;

  /**
   * Set the center of the disk.
   * @param {Vector3} center
   */
  setCenter(center: Vector3): boolean;

  /**
   * Set the circumferential resolution of the disk.
   * @param {number} resolution
   */
  setCircumferentialResolution(resolution: number): boolean;

  /**
   * Set the inner radius of the disk.
   * @param {number} radius
   */
  setInnerRadius(radius: number): boolean;

  /**
   * Set the normal of the disk.
   * @param {Vector3} normal
   */
  setNormal(normal: Vector3): boolean;

  /**
   * Set the outer radius of the disk.
   * @param {number} radius
   */
  setOuterRadius(radius: number): boolean;

  /**
   * Set the point type used for the disk.
   * @param {string} type
   */
  setPointType(type: string): boolean;

  /**
   * Set the radial resolution of the disk.
   * @param {number} resolution
   */
  setRadialResolution(resolution: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkDiskSource characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IDiskSourceInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IDiskSourceInitialValues
): void;

/**
 * Method used to create a new instance of vtkDiskSource.
 * @param {IDiskSourceInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IDiskSourceInitialValues
): vtkDiskSource;

/**
 * vtkDiskSource creates a polygonal disk with a hole in the center. The disk
 * has zero height. The user can specify the inner and outer radius of the disk,
 * the radial and circumferential resolution of the polygonal representation,
 * and the center and plane normal of the disk (i.e., the center and disk normal
 * control the position and orientation of the disk).
 *
 * @example
 * ```js
 * import vtkDiskSource from '@kitware/vtk.js/Filters/Sources/DiskSource';
 *
 * const disk = vtkDiskSource.newInstance({ radius: 1, resolution: 80 });
 * const polydata = disk.getOutputData();
 * ```
 */
export declare const vtkDiskSource: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkDiskSource;
