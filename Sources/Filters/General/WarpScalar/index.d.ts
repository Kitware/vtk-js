import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import { Vector3 } from '../../../types';

/**
 *
 */
export interface IWarpScalarInitialValues {
  scaleFactor?: number;
  useNormal?: boolean;
  normal?: Vector3;
  xyPlane?: boolean;
}

type vtkWarpScalarBase = vtkObject & vtkAlgorithm;

export interface vtkWarpScalar extends vtkWarpScalarBase {
  /**
   * Get the normal used when the input has no normals, or when useNormal is on.
   */
  getNormal(): Vector3;

  /**
   * Get the normal used when the input has no normals, or when useNormal is on.
   */
  getNormalByReference(): Vector3;

  /**
   * Get the amount by which the points are displaced along the normal.
   */
  getScaleFactor(): number;

  /**
   * Get whether the instance normal is used in place of the input normals.
   */
  getUseNormal(): boolean;

  /**
   * Get whether the z coordinate is used as the scalar to warp by.
   */
  getXyPlane(): boolean;

  /**
   *
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): number;

  /**
   * Set the normal used when the input has no normals, or when useNormal is on.
   * @param {Vector3} normal
   */
  setNormal(normal: Vector3): boolean;

  /**
   * Set the normal used when the input has no normals, or when useNormal is on.
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   */
  setNormal(x: number, y: number, z: number): boolean;

  /**
   * Set the normal used when the input has no normals, or when useNormal is on.
   * @param {Vector3} normal
   */
  setNormalFrom(normal: Vector3): void;

  /**
   * Set the amount by which the points are displaced along the normal.
   * @param {Number} scaleFactor
   */
  setScaleFactor(scaleFactor: number): boolean;

  /**
   * Set whether the instance normal is used in place of the input normals.
   * @param {Boolean} useNormal
   */
  setUseNormal(useNormal: boolean): boolean;

  /**
   * Set whether the z coordinate is used as the scalar to warp by, in which
   * case the points are displaced along the z axis.
   * @param {Boolean} xyPlane
   */
  setXyPlane(xyPlane: boolean): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWarpScalar characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWarpScalarInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWarpScalarInitialValues
): void;

/**
 * Method used to create a new instance of vtkWarpScalar
 * @param {IWarpScalarInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWarpScalarInitialValues
): vtkWarpScalar;

/**
 * vtkWarpScalar - deform a dataset along its normals by its scalars
 *
 * vtkWarpScalar displaces every point of its input along a normal by a distance
 * equal to the point scalar times the scale factor. The normal is taken from
 * the input point normals, from the instance normal, or from the z axis when
 * xyPlane is on. The scalars are read from the array selected with
 * setInputArrayToProcess.
 */
export declare const vtkWarpScalar: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWarpScalar;
