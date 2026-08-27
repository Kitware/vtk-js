import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import { Bounds, Vector3 } from '../../../types';
import vtkImplicitFunction from '../../../Common/DataModel/ImplicitFunction';

/**
 *
 */
export interface ISampleFunctionInitialValues {
  /**
   * The implicit function to sample. Has no accessor: it can only be given
   * through the initial values.
   */
  implicitFunction?: vtkImplicitFunction;

  sampleDimensions?: Vector3;

  modelBounds?: Bounds;

  /**
   * Typed array name used for the generated scalars. Has no accessor: it can
   * only be given through the initial values.
   */
  pointType?: string;
}

type vtkSampleFunctionBase = vtkObject & vtkAlgorithm;

export interface vtkSampleFunction extends vtkSampleFunctionBase {
  /**
   * Get the dimensions of the volume in the x-y-z directions.
   */
  getSampleDimensions(): Vector3;

  /**
   *
   */
  getSampleDimensionsByReference(): Vector3;

  /**
   * Set the dimensions of the volume in the x-y-z directions.
   * @param {Vector3} sampleDimensions
   */
  setSampleDimensions(sampleDimensions: Vector3): boolean;

  /**
   * Set the dimensions of the volume in the x-y-z directions.
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   */
  setSampleDimensions(x: number, y: number, z: number): boolean;

  /**
   *
   * @param {Vector3} sampleDimensions
   */
  setSampleDimensionsFrom(sampleDimensions: Vector3): void;

  /**
   * Get the bounds of the volume in 3D space.
   */
  getModelBounds(): Bounds;

  /**
   *
   */
  getModelBoundsByReference(): Bounds;

  /**
   * Set the bounds of the volume in 3D space.
   * @param {Bounds} modelBounds
   */
  setModelBounds(modelBounds: Bounds): boolean;

  /**
   * Set the bounds of the volume in 3D space.
   */
  setModelBounds(
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    zMin: number,
    zMax: number
  ): boolean;

  /**
   *
   * @param {Bounds} modelBounds
   */
  setModelBoundsFrom(modelBounds: Bounds): void;

  /**
   * The modified time is the maximum of this object's own modified time and
   * that of the implicit function being sampled.
   */
  getMTime(): number;

  /**
   *
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkSampleFunction characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ISampleFunctionInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ISampleFunctionInitialValues
): void;

/**
 * Method used to create a new instance of vtkSampleFunction
 * @param {ISampleFunctionInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: ISampleFunctionInitialValues
): vtkSampleFunction;

/**
 * vtkSampleFunction samples an implicit function over a volume. For example, a
 * vtkPlane or vtkSphere can be defined, along with a volume extent (dimensions
 * and geometric bounds), and the filter will then sample the implicit function
 * over all voxels, producing a vtkImageData.
 */
export declare const vtkSampleFunction: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkSampleFunction;
