import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import { Extent, Matrix3x3, Vector3 } from '../../../types';

/**
 *
 */
export interface IImageGridSourceInitialValues {
  lineValue?: number;
  fillValue?: number;
  gridSpacing?: Vector3;
  gridOrigin?: Vector3;
  dataSpacing?: Vector3;
  dataOrigin?: Vector3;
  dataExtent?: Extent;
  dataDirection?: Matrix3x3;
}

type vtkImageGridSourceBase = vtkObject &
  Omit<
    vtkAlgorithm,
    | 'getInputData'
    | 'setInputData'
    | 'setInputConnection'
    | 'getInputConnection'
    | 'addInputConnection'
    | 'addInputData'
  >;

export interface vtkImageGridSource extends vtkImageGridSourceBase {
  /**
   * Get the direction matrix of the output image.
   * @default [1, 0, 0, 0, 1, 0, 0, 0, 1]
   */
  getDataDirection(): Matrix3x3;

  /**
   * Get the direction matrix of the output image.
   */
  getDataDirectionByReference(): Matrix3x3;

  /**
   * Get the extent of the output image.
   * @default [0, 255, 0, 255, 0, 0]
   */
  getDataExtent(): Extent;

  /**
   * Get the extent of the output image.
   */
  getDataExtentByReference(): Extent;

  /**
   * Get the origin of the output image.
   * @default [0, 0, 0]
   */
  getDataOrigin(): Vector3;

  /**
   * Get the origin of the output image.
   */
  getDataOriginByReference(): Vector3;

  /**
   * Get the spacing of the output image.
   * @default [1, 1, 1]
   */
  getDataSpacing(): Vector3;

  /**
   * Get the spacing of the output image.
   */
  getDataSpacingByReference(): Vector3;

  /**
   * Get the value used for the voxels that are not on a grid line.
   * @default 255
   */
  getFillValue(): number;

  /**
   * Get the grid origin, expressed in voxel index.
   * @default [0, 0, 0]
   */
  getGridOrigin(): Vector3;

  /**
   * Get the grid origin, expressed in voxel index.
   */
  getGridOriginByReference(): Vector3;

  /**
   * Get the grid line period along each axis, expressed in voxels.
   * A period of 0 disables the grid lines for that axis.
   * @default [10, 10, 0]
   */
  getGridSpacing(): Vector3;

  /**
   * Get the grid line period along each axis, expressed in voxels.
   */
  getGridSpacingByReference(): Vector3;

  /**
   * Get the value used for the voxels that are on a grid line.
   * @default 0
   */
  getLineValue(): number;

  /**
   * Expose methods
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;

  /**
   * Set the direction matrix of the output image.
   * @param {Matrix3x3} dataDirection
   */
  setDataDirection(dataDirection: Matrix3x3): boolean;

  /**
   * Set the direction matrix of the output image.
   * @param {Number} e00
   * @param {Number} e01
   * @param {Number} e02
   * @param {Number} e10
   * @param {Number} e11
   * @param {Number} e12
   * @param {Number} e20
   * @param {Number} e21
   * @param {Number} e22
   */
  setDataDirection(
    e00: number,
    e01: number,
    e02: number,
    e10: number,
    e11: number,
    e12: number,
    e20: number,
    e21: number,
    e22: number
  ): boolean;

  /**
   * Set the direction matrix of the output image.
   * @param {Matrix3x3} dataDirection
   */
  setDataDirectionFrom(dataDirection: Matrix3x3): void;

  /**
   * Set the extent of the output image.
   * @param {Extent} dataExtent
   */
  setDataExtent(dataExtent: Extent): boolean;

  /**
   * Set the extent of the output image.
   * @param {Number} x1
   * @param {Number} x2
   * @param {Number} y1
   * @param {Number} y2
   * @param {Number} z1
   * @param {Number} z2
   */
  setDataExtent(
    x1: number,
    x2: number,
    y1: number,
    y2: number,
    z1: number,
    z2: number
  ): boolean;

  /**
   * Set the extent of the output image.
   * @param {Extent} dataExtent
   */
  setDataExtentFrom(dataExtent: Extent): void;

  /**
   * Set the origin of the output image.
   * @param {Number} x The x coordinate.
   * @param {Number} y The y coordinate.
   * @param {Number} z The z coordinate.
   */
  setDataOrigin(x: number, y: number, z: number): boolean;

  /**
   * Set the origin of the output image.
   * @param {Vector3} dataOrigin
   */
  setDataOrigin(dataOrigin: Vector3): boolean;

  /**
   * Set the origin of the output image.
   * @param {Vector3} dataOrigin
   */
  setDataOriginFrom(dataOrigin: Vector3): void;

  /**
   * Set the spacing of the output image.
   * @param {Number} x The x spacing.
   * @param {Number} y The y spacing.
   * @param {Number} z The z spacing.
   */
  setDataSpacing(x: number, y: number, z: number): boolean;

  /**
   * Set the spacing of the output image.
   * @param {Vector3} dataSpacing
   */
  setDataSpacing(dataSpacing: Vector3): boolean;

  /**
   * Set the spacing of the output image.
   * @param {Vector3} dataSpacing
   */
  setDataSpacingFrom(dataSpacing: Vector3): void;

  /**
   * Set the value used for the voxels that are not on a grid line.
   * @param {Number} fillValue
   */
  setFillValue(fillValue: number): boolean;

  /**
   * Set the grid origin, expressed in voxel index.
   * @param {Number} x The x coordinate.
   * @param {Number} y The y coordinate.
   * @param {Number} z The z coordinate.
   */
  setGridOrigin(x: number, y: number, z: number): boolean;

  /**
   * Set the grid origin, expressed in voxel index.
   * @param {Vector3} gridOrigin
   */
  setGridOrigin(gridOrigin: Vector3): boolean;

  /**
   * Set the grid origin, expressed in voxel index.
   * @param {Vector3} gridOrigin
   */
  setGridOriginFrom(gridOrigin: Vector3): void;

  /**
   * Set the grid line period along each axis, expressed in voxels.
   * A period of 0 disables the grid lines for that axis.
   * @param {Number} x The x period.
   * @param {Number} y The y period.
   * @param {Number} z The z period.
   */
  setGridSpacing(x: number, y: number, z: number): boolean;

  /**
   * Set the grid line period along each axis, expressed in voxels.
   * @param {Vector3} gridSpacing
   */
  setGridSpacing(gridSpacing: Vector3): boolean;

  /**
   * Set the grid line period along each axis, expressed in voxels.
   * @param {Vector3} gridSpacing
   */
  setGridSpacingFrom(gridSpacing: Vector3): void;

  /**
   * Set the value used for the voxels that are on a grid line.
   * @param {Number} lineValue
   */
  setLineValue(lineValue: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkImageGridSource characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IImageGridSourceInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IImageGridSourceInitialValues
): void;

/**
 * Method used to create a new instance of vtkImageGridSource.
 * @param {IImageGridSourceInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IImageGridSourceInitialValues
): vtkImageGridSource;

/**
 * vtkImageGridSource produces an image of a grid. The voxels that fall on a
 * grid line get the line value, all the others get the fill value. The grid
 * line period and offset are expressed in voxels through the grid spacing and
 * the grid origin, while the geometry of the produced image is controlled by
 * the data extent, origin, spacing and direction.
 *
 * @example
 * ```js
 * import vtkImageGridSource from '@kitware/vtk.js/Filters/Sources/ImageGridSource';
 *
 * const grid = vtkImageGridSource.newInstance({ gridSpacing: [20, 20, 0] });
 * const imageData = grid.getOutputData();
 * ```
 */
export declare const vtkImageGridSource: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkImageGridSource;
