import { mat3, mat4, ReadonlyVec3, vec3 } from 'gl-matrix';
import { Bounds, Extent, Vector3 } from '../../../types';
import vtkDataSet, { IDataSetInitialValues } from '../DataSet';

/**
 *
 */
export interface IImageDataInitialValues extends IDataSetInitialValues {
	spacing?: number[];
	origin?: number[];
	extent?: number[];
}

interface IComputeHistogram {
	minimum: number;
	maximum: number;
	average: number;
	variance: number;
	sigma: number;
}

export interface vtkImageData extends vtkDataSet {

	/**
	 * Returns an object with `{ minimum, maximum, average, variance, sigma, count }`
	 * of the imageData points found within the provided `worldBounds`.
	 *
	 * `voxelFunc(index, bounds)` is an optional function that is called with
	 * the `[i,j,k]` index and index `bounds`, expected to return truthy if the
	 * data point should be counted in the histogram, and falsey if not.
	 * @param {Bounds} worldBounds The bounds of the world.
	 * @param [voxelFunc] 
	 */
	computeHistogram(worldBounds: Bounds, voxelFunc?: any): IComputeHistogram;

	/**
	 * Returns an `array[3]` of values to multiply an `[i,j,k]` index to convert
	 * into the actual data array index, from the provided extent.
	 * `numberOfComponents` should match the Scalar components.
	 * @internal
	 * @param {Extent} extent 
	 * @param {Number} [numberOfComponents] 
	 */
	computeIncrements(extent: Extent, numberOfComponents?: number): number[]

	/**
	 * Converts an `[i,j,k]` index to the flat data array index. Returns `NaN`
	 * if any of the i,j,k bounds are outside the data Extent.
	 * @internal
	 * @param {Vector3} ijk The localized `[i,j,k]` pixel array position. Float values will be rounded.
	 * @return {Number} the corresponding flattened index in the scalar array
	 */
	computeOffsetIndex(ijk: Vector3): number;

	/**
	 * Calculates the `indexToWorld` and `worldToIndex` conversion matrices from
	 * the origin, direction, and spacing. Shouldn't need to call this as it is
	 * handled internally, and updated whenever the vtkImageData is modified.
	 * @internal
	 */
	computeTransforms(): void;

	/**
	 * Returns a bounds array from a given Extent, useful if you need to
	 * calculate the world bounds of a subset of the imageData's data.
	 * @internal
	 * @param {Extent} ex 
	 */
	extentToBounds(ex: Extent): Bounds;

	/**
	 * Get image extents without translation (i.e. with origin set to [0,0,0]) and under unit spacing
	 * (i.e. spacing = [1, 1, 1]).
	 * This includes a padding of 0.5 pixel/voxel in each principal direction.
	 * The padding is necessary for conventional images (textures, png, bmp)
	 * as well as medical images and volumes, since each pixel/voxel has a pre-defined width
	 * (based on specified spacing) including the ones on the boundary of the image.
	 * @internal
	 */
	getSpatialExtent(): Extent;

	/**
	 * Returns the axis-aligned bounds of vtkImageData in world coordinates.
	 * The axis-aligned Bounds of a vtkImage are returned as pairs of world coordinates
	 * ```[x_min, x_max, y_min, y_max, z_min, z_max]``` these are calculated
	 * from the Extent, Origin, and Spacing, defined
	 * through
	 * ```js
	 * [
	 *   (i_min - 0.5)*Spacing[0] + Origin[0], (i_max + 0.5)*Spacing[0] + Origin[0],
	 *   (j_min - 0.5)*Spacing[1] + Origin[1], (j_max + 0.5)*Spacing[1] + Origin[1],
	 *   (k_min - 0.5)*Spacing[2] + Origin[2], (k_max + 0.5)*Spacing[2] + Origin[2]
	 * ];
	 *  ```
	 * Note that this includes a padding of 0.5 voxel spacing in each principal direction,
	 * as well as any orientation of the image.
	 * You can't directly set the bounds. First you need to decide how many
	 * pixels across your image will be (i.e. what the extent should be), and
	 * then you must find the origin and spacing that will produce the bounds
	 * that you need from the extent that you have. This is simple algebra. In
	 * general, always set the extent to start at zero, e.g. `[0, 9, 0, 9, 0,
	 * 9]` for a 10x10x10 image. Calling `setDimensions(10,10,10)` does exactly
	 * the same thing as `setExtent(0,9,0,9,0,9)` but you should always do the
	 * latter to be explicit about where your extent starts.
	 * Such an image of dimensions [10, 10, 10], origin [0, 0, 0] and voxel-spacing of 1.0,
	 * will result in bounds equal to [-0.5, 9.5, -0.5, 9.5, -0.5, 9.5].
	 * @return {Bounds} The bounds for the mapper.
	 */
	getBounds(): Bounds;

	/**
	 * Get the `[x,y,z]` location of the center of the imageData.
	 */
	getCenter(): Vector3;

	/**
	 * Get dimensions of this structured points dataset. It is the number of
	 * points on each axis. Dimensions are computed from Extents during this
	 * call.
	 */
	getDimensions(): Vector3;

	/**
	 * Direction is a `mat3` matrix corresponding to the axes directions in
	 * world coordinates for the I, J, K axes of the image. Direction must form
	 * an orthonormal basis.
	 */
	getDirection(): mat3;

	/**
	 * The maximal extent of the projection.
	 * @default [0, -1, 0, -1, 0, -1]
	 */
	getExtent(): Extent;

	/**
	 *
	 * @default [0, -1, 0, -1, 0, -1]
	 */
	getExtentByReference(): Extent;

	/**
	 * Returns the data array index for the point at the provided world position.
	 * @param {Vector3} xyz The [x,y,z] array in world coordinates.
	 * @return {number} the corresponding pixel's index in the scalar array.
	 */
	getOffsetIndexFromWorld(xyz: Vector3): number;

	/**
	 *
	 */
	getNumberOfCells(): number;

	/**
	 * Get the number of points composing the dataset.
	 */
	getNumberOfPoints(): number;

	/**
	 * Get the world position of a data point. Index is the point's index in the
	 * 1D data array.
	 * @param {Number} index 
	 */
	getPoint(index: number): Vector3;

	/**
	 * Get the origin of the dataset. The origin is the position in world
	 * coordinates of the point of extent (0,0,0). This point does not have to
	 * be part of the dataset, in other words, the dataset extent does not have
	 * to start at (0,0,0) and the origin can be outside of the dataset bounding
	 * box. The origin plus spacing determine the position in space of the
	 * points.
	 */
	getOrigin(): Vector3;

	/**
	 * Get the origin of the dataset. The origin is the position in world
	 */
	getOriginByReference(): Vector3;

	/**
	 * Returns the scalar value for the point at the provided world position, or
	 * `NaN` if the world bounds are outside the volumeData bounds. `comp` is
	 * the scalar component index, for multi-component scalar data.
	 * @param {Vector3} xyz The [x,y,z] array in world coordinates.
	 * @param {Number} [comp] The scalar component index for multi-component scalars.
	 * @return {number|NaN} The corresponding pixel's scalar value.
	 */
	getScalarValueFromWorld(xyz: Vector3, comp?: number): number;

	/**
	 * Set the spacing [width, height, length] of the cubical cells that compose
	 * the data set.
	 */
	getSpacing(): Vector3;

	/**
	 *
	 */
	getSpacingByReference(): Vector3;

	/**
	 * Returns the `mat4` matrices used to convert between world and index.
	 * `worldToIndex` is the inverse matrix of `indexToWorld`. Both are made
	 * with `Float64Array`.
	 */
	getIndexToWorld(): mat4;

	/**
	 * Returns the `mat4` matrices used to convert between world and index.
	 * `worldToIndex` is the inverse matrix of `indexToWorld`. Both are made
	 * with `Float64Array`.
	 */
	getWorldToIndex(): mat4;

	/**
	 * this is the fast version, requires vec3 arguments
	 * @param {ReadonlyVec3} vin 
	 * @param {vec3} [vout] 
	 */
	indexToWorldVec3(vin: ReadonlyVec3, vout?: vec3): vec3;

	/**
	 * Converts the input index vector `[i,j,k]` to world values `[x,y,z]`. 
	 * If an out vector is not provided, a new one is created. If provided, it
	 * modifies the out vector array in place, but also returns it.
	 * @param {ReadonlyVec3} ain 
	 * @param {vec3} [aout] 
	 */
	indexToWorld(ain: ReadonlyVec3, aout?: vec3): vec3;

	/**
	 * Calculate the corresponding world bounds for the given index bounds
	 * `[i_min, i_max, j_min, j_max, k_min, k_max]`. Modifies `out` in place if
	 * provided, or returns a new array. Returned bounds are NOT padded based
	 * on voxel spacing (see getBounds). The output is merely a bounding box
	 * calculated considering voxels as grid points.
	 * @param {Bounds} bin 
	 * @param {Bounds} [bout] 
	 */
	indexToWorldBounds(bin: Bounds, bout?: Bounds): Bounds;

	/**
	 * Set the values of the extent, from `0` to `(i-1)`, etc.
	 * @param dims
	 */
	setDimensions(dims: number[]): void;

	/**
	 * Set the values of the extent, from `0` to `(i-1)`, etc.
	 * @param {Number} i 
	 * @param {Number} j 
	 * @param {Number} k 
	 */
	setDimensions(i: number, j: number, k: number): void;

	/**
	 * The direction matrix is a 3x3 basis for the I, J, K axes
	 * of the image. The rows of the matrix correspond to the
	 * axes directions in world coordinates. Direction must
	 * form an orthonormal basis, results are undefined if
	 * it is not.
	 * @param {mat3} direction
	 */
	setDirection(direction: mat3): boolean;

	/**
	   * The direction matrix is a 3x3 basis for the I, J, K axes
	 * of the image. The rows of the matrix correspond to the
	 * axes directions in world coordinates. Direction must
	 * form an orthonormal basis, results are undefined if
	 * it is not.
	 * @param e00
	 * @param e01
	 * @param e02
	 * @param e10
	 * @param e11
	 * @param e12
	 * @param e20
	 * @param e21
	 * @param e22
	 */
	setDirection(e00: number, e01: number, e02: number, e10: number, e11: number, e12: number, e20: number, e21: number, e22: number): boolean;

	/**
	 * Set the extent.
	 * @param {Extent} extent 
	 */
	setExtent(extent: Extent): boolean;

	/**
	 *
	 * @param {Number} x1 The x coordinate of the first point.
	 * @param {Number} x2 The x coordinate of the second point.
	 * @param {Number} y1 The y coordinate of the first point.
	 * @param {Number} y2 The y coordinate of the second point.
	 * @param {Number} z1 The z coordinate of the first point.
	 * @param {Number} z2 The z coordinate of the second point.
	 */
	setExtent(x1: number, x2: number, y1: number, y2: number, z1: number, z2: number): void;

	/**
	 * Set the origin of the image.
	 * @param {Vector3} origin The coordinate of the origin point.
	 */
	setOrigin(origin: Vector3): boolean;

	/**
	 * Set the origin of the image.
	 * @param {Vector3} origin The coordinate of the origin point.
	 */
	setOriginFrom(origin: Vector3): boolean;

	/**
	 *
	 * @param spacing 
	 */
	setSpacing(spacing: number[]): boolean;

	/**
	 *
	 * @param spacing 
	 */
	setSpacingFrom(spacing: number[]): boolean;

	/**
	 * this is the fast version, requires vec3 arguments
	 * @param vin 
	 * @param [vout] 
	 */
	worldToIndexVec3(vin: ReadonlyVec3, vout?: vec3): vec3;

	/**
	 * Converts the input world vector `[x,y,z]` to approximate index values
	 * `[i,j,k]`. Should be rounded to integers before attempting to access the
	 * index. If an out vector is not provided, a new one is created. If provided, it
	 * modifies the out vector array in place, but also returns it.
	 * @param ain 
	 * @param [aout] 
	 */
	worldToIndex(ain: ReadonlyVec3, aout?: vec3): vec3;

	/**
	 * Calculate the corresponding index bounds for the given world bounds
	 * `[x_min, x_max, y_min, y_max, z_min, z_max]`. Modifies `out` in place if
	 * provided, or returns a new array.
	 * @param {Bounds} bin 
	 * @param {Bounds} [bout] 
	 */
	worldToIndexBounds(bin: Bounds, bout?: Bounds): number[];
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkImageData characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IImageDataInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IImageDataInitialValues): void;

/**
 * Method used to create a new instance of vtkImageData.
 * @param {IImageDataInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IImageDataInitialValues): vtkImageData;

/**
 * vtkImageData is a data object that is a concrete implementation of
 * vtkDataSet. vtkImageData represents a geometric structure that is a
 * topological and geometrical regular array of points. Examples include volumes
 * (voxel data) and pixmaps. All vtkDataSet functions are inherited.
 */
export declare const vtkImageData: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkImageData;
