import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import { Vector3 } from '../../../types';

/**
 *
 */
export interface ISLICSourceInitialValues {
  clusters?: Float64Array[];
  spacing?: Vector3;
  origin?: Vector3;
  dimensions?: Vector3;
  clusterArrayName?: string;
  scalarArrayName?: string;
}

type vtkSLICSourceBase = vtkObject &
  Omit<
    vtkAlgorithm,
    | 'getInputData'
    | 'setInputData'
    | 'setInputConnection'
    | 'getInputConnection'
    | 'addInputConnection'
    | 'addInputData'
  >;

export interface vtkSLICSource extends vtkSLICSourceBase {
  /**
   * Add a cluster centered on the given world position, whose field is the
   * affine function `fnConst + fnDfDx * dx + fnDfDy * dy + fnDfDz * dz` where
   * `d*` is the offset from the cluster center.
   * @param {Number} centerX
   * @param {Number} centerY
   * @param {Number} centerZ
   * @param {Number} fnConst
   * @param {Number} fnDfDx
   * @param {Number} fnDfDy
   * @param {Number} fnDfDz
   * @returns the id of the newly created cluster
   */
  addCluster(
    centerX: number,
    centerY: number,
    centerZ: number,
    fnConst: number,
    fnDfDx: number,
    fnDfDy: number,
    fnDfDz: number
  ): number;

  /**
   * Get the name of the output array holding the cluster index of each voxel.
   * @default 'cluster'
   */
  getClusterArrayName(): string;

  /**
   * Get the dimensions of the output image.
   * @default [10, 10, 10]
   */
  getDimensions(): Vector3;

  /**
   * Get the dimensions of the output image.
   */
  getDimensionsByReference(): Vector3;

  /**
   * Get the number of clusters.
   */
  getNumberOfClusters(): number;

  /**
   * Get the origin of the output image.
   * @default [0, 0, 0]
   */
  getOrigin(): Vector3;

  /**
   * Get the origin of the output image.
   */
  getOriginByReference(): Vector3;

  /**
   * Get the name of the output array holding the field value of each voxel.
   * @default 'field'
   */
  getScalarArrayName(): string;

  /**
   * Get the spacing of the output image.
   * @default [1, 1, 1]
   */
  getSpacing(): Vector3;

  /**
   * Get the spacing of the output image.
   */
  getSpacingByReference(): Vector3;

  /**
   * Remove every cluster.
   */
  removeAllClusters(): void;

  /**
   * Remove the cluster with the given id.
   * Removing a cluster shifts the ids of the following ones.
   * @param {Number} id
   */
  removeCluster(id: number): void;

  /**
   * Expose methods
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;

  /**
   * Set the name of the output array holding the cluster index of each voxel.
   * @param {String} clusterArrayName
   */
  setClusterArrayName(clusterArrayName: string): boolean;

  /**
   * Set the dimensions of the output image.
   * @param {Number} x The x dimension.
   * @param {Number} y The y dimension.
   * @param {Number} z The z dimension.
   */
  setDimensions(x: number, y: number, z: number): boolean;

  /**
   * Set the dimensions of the output image.
   * @param {Vector3} dimensions
   */
  setDimensions(dimensions: Vector3): boolean;

  /**
   * Set the dimensions of the output image.
   * @param {Vector3} dimensions
   */
  setDimensionsFrom(dimensions: Vector3): void;

  /**
   * Set the origin of the output image.
   * @param {Number} x The x coordinate.
   * @param {Number} y The y coordinate.
   * @param {Number} z The z coordinate.
   */
  setOrigin(x: number, y: number, z: number): boolean;

  /**
   * Set the origin of the output image.
   * @param {Vector3} origin
   */
  setOrigin(origin: Vector3): boolean;

  /**
   * Set the origin of the output image.
   * @param {Vector3} origin
   */
  setOriginFrom(origin: Vector3): void;

  /**
   * Set the name of the output array holding the field value of each voxel.
   * @param {String} scalarArrayName
   */
  setScalarArrayName(scalarArrayName: string): boolean;

  /**
   * Set the spacing of the output image.
   * @param {Number} x The x spacing.
   * @param {Number} y The y spacing.
   * @param {Number} z The z spacing.
   */
  setSpacing(x: number, y: number, z: number): boolean;

  /**
   * Set the spacing of the output image.
   * @param {Vector3} spacing
   */
  setSpacing(spacing: Vector3): boolean;

  /**
   * Set the spacing of the output image.
   * @param {Vector3} spacing
   */
  setSpacingFrom(spacing: Vector3): void;

  /**
   * Replace the definition of the cluster with the given id, creating it when
   * it does not exist yet.
   * @param {Number} id
   * @param {Number} centerX
   * @param {Number} centerY
   * @param {Number} centerZ
   * @param {Number} fnConst
   * @param {Number} fnDfDx
   * @param {Number} fnDfDy
   * @param {Number} fnDfDz
   */
  updateCluster(
    id: number,
    centerX: number,
    centerY: number,
    centerZ: number,
    fnConst: number,
    fnDfDx: number,
    fnDfDy: number,
    fnDfDz: number
  ): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkSLICSource characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ISLICSourceInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ISLICSourceInitialValues
): void;

/**
 * Method used to create a new instance of vtkSLICSource.
 * @param {ISLICSourceInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: ISLICSourceInitialValues
): vtkSLICSource;

/**
 * vtkSLICSource generates a synthetic image made of Voronoi cells (clusters).
 * Each voxel is assigned to its closest cluster center, and its scalar value is
 * given by the affine function attached to that cluster. The output image holds
 * two point arrays: the cluster index and the field value.
 *
 * @example
 * ```js
 * import vtkSLICSource from '@kitware/vtk.js/Filters/Sources/SLICSource';
 *
 * const source = vtkSLICSource.newInstance({ dimensions: [20, 20, 20] });
 * source.addCluster(5, 5, 5, 1, 0, 0, 0);
 * source.addCluster(15, 15, 15, 2, 0, 0, 0);
 * const imageData = source.getOutputData();
 * ```
 */
export declare const vtkSLICSource: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkSLICSource;
