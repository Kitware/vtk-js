import {
  Bounds,
  Extent,
  Nullable,
  RGBAColor,
  TypedArray,
} from '../../../types';
import { InterpolationMode } from '../AbstractImageInterpolator/Constants';
import { SlabMode } from './Constants';
import { vtkAlgorithm, vtkObject, vtkRange } from '../../../interfaces';
import vtkImageData from '../../../Common/DataModel/ImageData';
import vtkTransform from '../../../Common/Transform/Transform';

import { mat3, mat4, vec3, vec4 } from 'gl-matrix';

/**
 *
 */
export interface IImageResliceInitialValues {
  transformInputSampling: boolean;
  autoCropOutput: boolean;
  outputDimensionality: number;
  outputSpacing: Nullable<vec3>; // automatically computed if null
  outputOrigin: Nullable<vec3>; // automatically computed if null
  outputDirection: Nullable<mat3>; // identity if null
  outputExtent: Nullable<Extent>; // automatically computed if null
  outputScalarType: Nullable<string>;
  wrap: boolean; // don't wrap
  mirror: boolean; // don't mirror
  border: boolean; // apply a border
  interpolationMode: InterpolationMode; // only NEAREST supported so far
  slabMode: SlabMode;
  slabTrapezoidIntegration: boolean;
  slabNumberOfSlices: number;
  slabSliceSpacingFraction: number;
  optimization: boolean; // not supported yet
  scalarShift: number; // for rescaling the data
  scalarScale: number;
  backgroundColor: RGBAColor;
  resliceAxes: Nullable<mat4>;
  resliceTransform?: vtkTransform;
  interpolator: any; // A vtkImageInterpolator (missing typescript header)
  usePermuteExecute: boolean; // no supported yet
}

type vtkImageResliceBase = Omit<vtkObject, 'set'> & vtkAlgorithm;

export interface vtkImageReslice extends vtkImageResliceBase {
  /**
   *
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;

  /**
   * Main filter logic
   * @param input
   * @param output
   * @returns
   */
  vtkImageResliceExecute: (input: vtkImageData, output: vtkImageData) => void;

  /**
   * The transform matrix supplied by the user converts output coordinates
   * to input coordinates.
   * To speed up the pixel lookup, the following function provides a
   * matrix which converts output pixel indices to input pixel indices.
   * This will also concatenate the ResliceAxes and the ResliceTransform
   * if possible (if the ResliceTransform is a 4x4 matrix transform).
   * If it does, this->OptimizedTransform will be set to nullptr, otherwise
   * this->OptimizedTransform will be equal to this->ResliceTransform.
   * @param {vtkImageData} input
   * @param {vtkImageData} output
   * @returns
   */
  getIndexMatrix: (input: vtkImageData, output: vtkImageData) => mat4;

  /**
   * Compute the bounds required to ensure that none of the data will be cropped
   * @param input
   * @returns
   */
  getAutoCroppedOutputBounds: (input: vtkImageData) => Bounds;

  /**
   * The min and max of each data type
   * Defaults to a range of 0 to 255
   * @param dataType
   * @returns
   */
  getDataTypeMinMax: (dataType: string) => vtkRange;

  /**
   * Internal function uses vtkInterpolationMathClamp on `numscalars * n` elements
   * @param outPtr
   * @param inPtr
   * @param numscalars
   * @param n
   * @param min
   * @param max
   * @returns The number of elements processed
   */
  clamp: (
    outPtr: TypedArray,
    inPtr: TypedArray,
    numscalars: number,
    n: number,
    min: number,
    max: number
  ) => number;

  /**
   * Internal function uses Math.round on `numscalars * n` elements
   * @param outPtr
   * @param inPtr
   * @param numscalars
   * @param n
   * @returns The number of elements processed
   */
  convert: (
    outPtr: TypedArray,
    inPtr: TypedArray,
    numscalars: number,
    n: number
  ) => number;

  /**
   * Setup the conversion function and return the right one
   * @param inputType
   * @param dataType
   * @param scalarShift
   * @param scalarScale
   * @param forceClamping
   * @returns publicAPI.convert or publicAPI.clamp
   */
  getConversionFunc: (
    inputType: string,
    dataType: string,
    scalarShift: number,
    scalarScale: number,
    forceClamping: boolean
  ) => this['convert'] & this['clamp'];

  /**
   * Copy the `numscalars * n` first elements from an array to another
   * @param outPtr
   * @param inPtr
   * @param numscalars
   * @param n
   * @returns The number of copied elements
   */
  set: (
    outPtr: TypedArray,
    inPtr: TypedArray,
    numscalars: number,
    n: number
  ) => number;

  /**
   * Fill the `n` first elements of the output array with the very first element of the input array
   * @param outPtr
   * @param inPtr
   * @param numscalars
   * @param n
   * @returns The number of elements set in the output array
   */
  set1: (
    outPtr: TypedArray,
    inPtr: TypedArray,
    numscalars: number,
    n: number
  ) => number;

  /**
   * Returns the right function used to copy the pixels
   * @param dataType
   * @param dataSize
   * @param numscalars
   * @param dataPtr
   * @returns publicAPI.set or publicAPI.set1
   */
  getSetPixelsFunc: (
    dataType: any,
    dataSize: any,
    numscalars: number,
    dataPtr: any
  ) => this['set'] & this['set1'];

  /**
   * Returns the right composition function
   * @param slabMode
   * @param slabTrapezoidIntegration
   * @returns
   */
  getCompositeFunc: (
    slabMode: SlabMode,
    slabTrapezoidIntegration: boolean
  ) => (tmpPtr: TypedArray, inComponents: number, sampleCount: number) => void;

  /**
   * Apply `newTrans`, then translate by `-origin`, then scale by `inInvSpacing`
   * @param newTrans
   * @param inPoint
   * @param inOrigin
   * @param inInvSpacing
   * @returns
   */
  applyTransform: (
    newTrans: mat4,
    inPoint: vec4,
    inOrigin: vec3,
    inInvSpacing: vec3
  ) => void;

  /**
   *
   * @param floatData
   * @param components
   * @param n
   * @param scalarShift
   * @param scalarScale
   * @returns
   */
  rescaleScalars: (
    floatData: TypedArray,
    components: number,
    n: number,
    scalarShift: number,
    scalarScale: number
  ) => void;

  /**
   * A permutation matrix is the identity matrix with the colomn (or rows) shuffled
   * @param matrix
   * @returns
   */
  isPermutationMatrix: (matrix: mat4) => boolean;

  /**
   *
   * @param matrix
   * @returns
   */
  isIdentityMatrix: (matrix: mat4) => boolean;

  /**
   *
   * @param matrix
   * @returns
   */
  isPerspectiveMatrix: (matrix: mat4) => boolean;

  /**
   *
   * @param matrix
   * @param outExt
   * @returns
   */
  canUseNearestNeighbor: (matrix: mat4, outExt: Extent) => boolean;

  // Setters and getters

  /**
   * Set the slab mode, for generating thick slices.
   * The default is SlabMode.MIN. If SetSlabNumberOfSlices(N) is called with N
   * greater than one, then each output slice will actually be a composite of N
   * slices. This method specifies the compositing mode to be used.
   * @param slabMode
   * @returns
   */
  setSlabMode: (slabMode: SlabMode) => boolean;

  /**
   * @see setSlabMode
   * @returns
   */
  getSlabMode: () => SlabMode;

  /**
   * Set the number of slices that will be combined to create the slab.
   * Defaults to 1.
   * @param numberOfSlices
   * @returns
   */
  setSlabNumberOfSlices: (slabNumberOfSlices: number) => boolean;

  /**
   * @see setSlabNumberOfSlices
   * @returns
   */
  getSlabNumberOfSlices: () => number;

  /**
   * Specify whether to transform the spacing, origin and extent of the Input
   * (or the InformationInput) according to the direction cosines and origin of
   * the ResliceAxes before applying them as the default output spacing, origin
   * and extent.
   * Defaults to false.
   * @param transformInputSampling
   * @returns
   */
  setTransformInputSampling: (transformInputSampling: boolean) => boolean;

  /**
   * @see setTransformInputSampling
   * @returns
   */
  getTransformInputSampling: () => boolean;

  /**
   * Turn this on if you want to guarantee that the extent of the output will
   * be large enough to ensure that none of the data will be cropped.
   * Defaults to false.
   * @param autoCropOutput
   * @returns
   */
  setAutoCropOutput: (autoCropOutput: boolean) => boolean;

  /**
   * @see setAutoCropOutput
   * @returns
   */
  getAutoCropOutput: () => boolean;

  /**
   * Force the dimensionality of the output to either 1, 2, 3 or 0.
   * If the dimensionality is 2D, then the Z extent of the output is forced to
   * (0,0) and the Z origin of the output is forced to 0.0 (i.e. the output
   * extent is confined to the xy plane). If the dimensionality is 1D, the
   * output extent is confined to the x axis. For 0D, the output extent
   * consists of a single voxel at (0,0,0).
   * Defaults to 3.
   * @param outputDimensionality
   * @returns
   */
  setOutputDimensionality: (outputDimensionality: number) => boolean;

  /**
   * @see setOutputDimensionality
   * @returns
   */
  getOutputDimensionality: () => number;

  /**
   * Set the voxel spacing for the output data.
   * The default output spacing is the input spacing permuted through the
   * ResliceAxes.
   * Defaults to null (automatically computed).
   * @param outputSpacing
   * @returns
   */
  setOutputSpacing: (outputSpacing: vec3 | null) => boolean;

  /**
   * @see setOutputSpacing
   * @returns
   */
  getOutputSpacing: () => vec3 | null;

  /**
   * Set the origin for the output data.
   * The default output origin is the input origin permuted through the
   * ResliceAxes.
   * Defaults to null (automatically computed).
   * @param outputOrigin
   * @returns
   */
  setOutputOrigin: (outputOrigin: vec3 | null) => boolean;

  /**
   * @see setOutputOrigin
   * @returns
   */
  getOutputOrigin: () => vec3 | null;

  /**
   * Set the extent for the output data.
   * The default output extent is the input extent permuted through the
   * ResliceAxes.
   * Defaults to null (automatically computed).
   * @param outputExtent
   * @returns
   */
  setOutputExtent: (outputExtent: Extent | null) => boolean;

  /**
   * @see setOutputExtent
   * @returns
   */
  getOutputExtent: () => Extent | null;

  /**
   * Set the direction for the output data.
   * By default, the direction of the input data is passed to the output.
   * But if SetOutputDirection() is used, then the image will be resliced
   * according to the new output direction. Unlike SetResliceAxes(), this does
   * not change the physical coordinate system for the image. Instead, it
   * changes the orientation of the sampling grid while maintaining the same
   * physical coordinate system.
   * Defaults to null (automatically computed).
   * @param outputDirection
   * @returns
   */
  setOutputDirection: (outputDirection: mat3 | null) => boolean;

  /**
   * @see setOutputDirection
   * @returns
   */
  getOutputDirection: () => mat3 | null;

  /**
   * Set the background color (for multi-component images).
   * Defaults to full opaque black.
   * @param backgroundColor
   * @returns
   */
  setBackgroundColor: (backgroundColor: RGBAColor) => boolean;

  /**
   * @see setBackgroundColor
   * @returns
   */
  getBackgroundColor: () => RGBAColor;

  /**
   * This method is used to set up the axes for the output voxels.
   * The output Spacing, Origin, and Extent specify the locations
   * of the voxels within the coordinate system defined by the axes.
   * The ResliceAxes are used most often to permute the data, e.g.
   * to extract ZY or XZ slices of a volume as 2D XY images.
   * The first column of the matrix specifies the x-axis
   * vector (the fourth element must be set to zero), the second
   * column specifies the y-axis, and the third column the
   * z-axis.  The fourth column is the origin of the
   * axes (the fourth element must be set to one).
   * @param resliceAxes
   * @returns
   */
  setResliceAxes: (resliceAxes: mat4) => boolean;

  /**
   * @see setResliceAxes
   * @returns
   */
  getResliceAxes: () => mat4;

  /**
   * Set the scalar type of the output to be different from the input.
   * The default value is null, which means that the input scalar type will be
   * used to set the output scalar type.  Otherwise, this must be set to one
   * of the following types: VtkDataTypes.CHAR, VtkDataTypes.SIGNED_CHAR,
   * VtkDataTypes.UNSIGNED_CHAR, VtkDataTypes.SHORT, VtkDataTypes.UNSIGNED_SHORT,
   * VtkDataTypes.INT, VtkDataTypes.UNSIGNED_INT, VtkDataTypes.FLOAT or
   * VtkDataTypes.DOUBLE. Other types are not permitted. If the output type
   * is an integer type, the output will be rounded and clamped to the limits of
   * the type.
   *
   * See the documentation for [vtkDataArray::getDataType()](../api/Common_Core_DataArray.html#getDataType-String) for additional data type settings.
   * Defaults to null (automatically computed).
   * @param outputScalarType
   * @returns
   */
  setOutputScalarType: (outputScalarType: string | null) => boolean;

  /**
   * @see setOutputScalarType
   * @returns
   */
  getOutputScalarType: () => string | null;

  /**
   * Set a value to add to all the output voxels.
   * After a sample value has been interpolated from the input image, the
   * equation u = (v + ScalarShift)*ScalarScale will be applied to it before
   * it is written to the output image.  The result will always be clamped to
   * the limits of the output data type.
   * Defaults to 0.
   * @param scalarShift
   * @returns
   */
  setScalarShift: (scalarShift: number) => boolean;

  /**
   * @see setScalarShift
   * @returns
   */
  getScalarShift: () => number;

  /**
   * Set multiplication factor to apply to all the output voxels.
   * After a sample value has been interpolated from the input image, the
   * equation u = (v + ScalarShift)*ScalarScale will be applied to it before
   * it is written to the output image.  The result will always be clamped to
   * the limits of the output data type.
   * Defaults to 1.
   * @param scalarScale
   * @returns
   */
  setScalarScale: (scalarScale: number) => boolean;

  /**
   * @see setScalarScale
   * @returns
   */
  getScalarScale: () => number;

  /**
   * Turn on wrap-pad feature.
   * Defaults to false.
   * @param wrap
   * @returns
   */
  setWrap: (wrap: boolean) => boolean;

  /**
   * @see setWrap
   * @returns
   */
  getWrap: () => boolean;

  /**
   * Turn on mirror-pad feature. This will override the wrap-pad.
   * Defaults to false.
   * @param mirror
   * @returns
   */
  setMirror: (mirror: boolean) => boolean;

  /**
   * @see setMirror
   * @returns
   */
  getMirror: () => boolean;

  /**
   * Extend the apparent input border by a half voxel.
   * This changes how interpolation is handled at the borders of the
   * input image: if the center of an output voxel is beyond the edge
   * of the input image, but is within a half voxel width of the edge
   * (using the input voxel width), then the value of the output voxel
   * is calculated as if the input's edge voxels were duplicated past
   * the edges of the input.
   * This has no effect if Mirror or Wrap are on.
   * Defaults to true.
   * @param border
   * @returns
   */
  setBorder: (border: boolean) => boolean;

  /**
   * @see setBorder
   * @returns
   */
  getBorder: () => boolean;

  /**
   * Set interpolation mode.
   * Only nearest neighbor is supported at the moment.
   * Defaults to nearest neighbor.
   * @param interpolationMode
   * @returns
   */
  setInterpolationMode: (interpolationMode: InterpolationMode) => boolean;

  /**
   * @see setInterpolationMode
   * @returns
   */
  getInterpolationMode: () => InterpolationMode;

  /**
   * Set a transform to be applied to the resampling grid that has been
   * defined via the ResliceAxes and the output Origin, Spacing and Extent.
   * Note that applying a transform to the resampling grid (which lies in
   * the output coordinate system) is equivalent to applying the inverse of
   * that transform to the input volume. Nonlinear transforms such as
   * vtkGridTransform and vtkThinPlateSplineTransform can be used here.
   * Defaults to undefined.
   * @param resliceTransform
   * @returns
   */
  setResliceTransform: (resliceTransform: vtkTransform | undefined) => boolean;

  /**
   * @see setResliceTransform
   * @returns
   */
  getResliceTransform: () => vtkTransform | undefined;

  /**
   * Use trapezoid integration for slab computation.
   * All this does is weigh the first and last slices by half when doing sum
   * and mean. It is off by default.
   * Defaults to false.
   * @param slabTrapezoidIntegration
   * @returns
   */
  setSlabTrapezoidIntegration: (slabTrapezoidIntegration: boolean) => boolean;

  /**
   * @see setSlabTrapezoidIntegration
   * @returns
   */
  getSlabTrapezoidIntegration: () => boolean;

  /**
   * The slab spacing as a fraction of the output slice spacing.
   * When one of the various slab modes is chosen, each output slice is
   * produced by generating several "temporary" output slices and then
   * combining them according to the slab mode. By default, the spacing between
   * these temporary slices is the Z component of the OutputSpacing. This
   * method sets the spacing between these temporary slices to be a fraction of
   * the output spacing.
   * Defaults to 1.
   * @param slabSliceSpacingFraction
   * @returns
   */
  setSlabSliceSpacingFraction: (slabSliceSpacingFraction: number) => boolean;

  /**
   * @see setSlabSliceSpacingFraction
   * @returns
   */
  getSlabSliceSpacingFraction: () => number;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkImageReslice characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IImageResliceInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IImageResliceInitialValues
): void;

/**
 * Method used to create a new instance of vtkImageReslice
 * @param {IImageResliceInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IImageResliceInitialValues
): vtkImageReslice;

/**
 * vtkImageReslice - Reslices a volume along a new set of axes
 *
 * vtkImageReslice is the swiss-army-knife of image geometry filters:
 * It can permute, rotate, flip, scale, resample, deform, and pad image
 * data in any combination with reasonably high efficiency.  Simple
 * operations such as permutation, resampling and padding are done
 * with similar efficiently to the specialized vtkImagePermute,
 * vtkImageResample, and vtkImagePad filters.  There are a number of
 * tasks that vtkImageReslice is well suited for:
 * 1) Application of simple rotations, scales, and translations to
 * an image. It is often a good idea to use vtkImageChangeInformation
 * to center the image first, so that scales and rotations occur around
 * the center rather than around the lower-left corner of the image.
 * 2) Extraction of slices from an image volume. The method
 * SetOutputDimensionality(2) is used to specify that want to output a
 * slice rather than a volume. You can use both the resliceAxes and the
 * resliceTransform at the same time, in order to extract slices from a
 * volume that you have applied a transformation to.
 * */
export declare const vtkImageReslice: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkImageReslice;
