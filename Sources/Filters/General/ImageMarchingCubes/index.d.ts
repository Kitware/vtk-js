import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import { Extent, TypedArray, Vector3 } from '../../../types';

/**
 *
 */
export interface IImageMarchingCubesInitialValues {
  contourValue?: number;
  computeNormals?: boolean;
  mergePoints?: boolean;
}

type vtkImageMarchingCubesBase = vtkObject & vtkAlgorithm;

export interface vtkImageMarchingCubes extends vtkImageMarchingCubesBase {
  /**
   * Get whether point normals are interpolated from the scalar gradient.
   */
  getComputeNormals(): boolean;

  /**
   * Get the iso-value at which the surface is extracted.
   */
  getContourValue(): number;

  /**
   * Get whether points shared by neighboring voxels are merged.
   */
  getMergePoints(): boolean;

  /**
   * Compute the scalar gradient at the i-j-k point and store it in `g`.
   * @param {Number} i
   * @param {Number} j
   * @param {Number} k
   * @param {Vector3} dims
   * @param {Number} slice number of points in one i-j slice
   * @param {Vector3} spacing
   * @param {TypedArray|Number[]} s scalar values
   * @param {Number[]} g gradient output
   */
  getPointGradient(
    i: number,
    j: number,
    k: number,
    dims: Vector3,
    slice: number,
    spacing: Vector3,
    s: TypedArray | number[],
    g: number[]
  ): void;

  /**
   * Compute the gradients of the eight corners of the voxel whose origin is
   * i-j-k and cache them for the next call to produceTriangles.
   * @param {Number} i
   * @param {Number} j
   * @param {Number} k
   * @param {Vector3} dims
   * @param {Number} slice number of points in one i-j slice
   * @param {Vector3} spacing
   * @param {TypedArray|Number[]} scalars
   */
  getVoxelGradients(
    i: number,
    j: number,
    k: number,
    dims: Vector3,
    slice: number,
    spacing: Vector3,
    scalars: TypedArray | number[]
  ): void;

  /**
   * Compute the world coordinates of the eight corners of the voxel whose
   * origin is i-j-k and cache them for the next call to produceTriangles.
   * @param {Number} i
   * @param {Number} j
   * @param {Number} k
   * @param {Vector3} origin
   * @param {Vector3} spacing
   */
  getVoxelPoints(
    i: number,
    j: number,
    k: number,
    origin: Vector3,
    spacing: Vector3
  ): void;

  /**
   * Cache the point ids and the scalar values of the eight corners of the voxel
   * whose origin is i-j-k.
   * @param {Number} i
   * @param {Number} j
   * @param {Number} k
   * @param {Number} slice number of points in one i-j slice
   * @param {Vector3} dims
   * @param {Vector3} origin
   * @param {Vector3} spacing
   * @param {TypedArray|Number[]} s scalar values
   */
  getVoxelScalars(
    i: number,
    j: number,
    k: number,
    slice: number,
    dims: Vector3,
    origin: Vector3,
    spacing: Vector3,
    s: TypedArray | number[]
  ): void;

  /**
   * Append the triangles contributed by one voxel to `points`, `tris` and,
   * when computeNormals is on, `normals`.
   * @param {Number} cVal contour value
   * @param {Number} i
   * @param {Number} j
   * @param {Number} k
   * @param {Extent} extent
   * @param {Number} slice number of points in one i-j slice
   * @param {Vector3} dims
   * @param {Vector3} origin
   * @param {Vector3} spacing
   * @param {TypedArray|Number[]} scalars
   * @param {Number[]} points
   * @param {Number[]} tris
   * @param {Number[]} normals
   */
  produceTriangles(
    cVal: number,
    i: number,
    j: number,
    k: number,
    extent: Extent,
    slice: number,
    dims: Vector3,
    origin: Vector3,
    spacing: Vector3,
    scalars: TypedArray | number[],
    points: number[],
    tris: number[],
    normals: number[]
  ): void;

  /**
   *
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;

  /**
   * Set whether point normals are interpolated from the scalar gradient.
   * @param {Boolean} computeNormals
   */
  setComputeNormals(computeNormals: boolean): boolean;

  /**
   * Set the iso-value at which the surface is extracted.
   * @param {Number} contourValue
   */
  setContourValue(contourValue: number): boolean;

  /**
   * Set whether points shared by neighboring voxels are merged.
   * @param {Boolean} mergePoints
   */
  setMergePoints(mergePoints: boolean): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkImageMarchingCubes characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IImageMarchingCubesInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IImageMarchingCubesInitialValues
): void;

/**
 * Method used to create a new instance of vtkImageMarchingCubes
 * @param {IImageMarchingCubesInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IImageMarchingCubesInitialValues
): vtkImageMarchingCubes;

/**
 * vtkImageMarchingCubes - generate an isosurface from a vtkImageData
 *
 * vtkImageMarchingCubes is a filter that takes a vtkImageData as input and
 * generates, using the marching cubes case table, a vtkPolyData containing the
 * triangles of the isosurface at the requested contour value.
 */
export declare const vtkImageMarchingCubes: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkImageMarchingCubes;
