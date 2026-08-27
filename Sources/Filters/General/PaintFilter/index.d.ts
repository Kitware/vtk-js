import { mat4 } from 'gl-matrix';
import vtkImageData from '../../../Common/DataModel/ImageData';
import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import { Nullable, Vector3 } from '../../../types';

/**
 * Decides, for one voxel of the background image, whether the label is applied.
 *
 * @param voxel the tuple of the background image at `index`
 * @param index flat point index
 * @param label the label about to be written
 */
export type VoxelFunc = (
  voxel: number[],
  index: number,
  label: number
) => boolean;

/**
 *
 */
export interface IPaintFilterInitialValues {
  backgroundImage?: vtkImageData;
  labelMap?: vtkImageData;
  maskWorldToIndex?: mat4;
  voxelFunc?: VoxelFunc;
  radius?: number;
  label?: number;
  slicingMode?: number;
}

type vtkPaintFilterBase = vtkObject &
  Omit<
    vtkAlgorithm,
    | 'setInputData'
    | 'setInputConnection'
    | 'addInputData'
    | 'addInputConnection'
    | 'getInputData'
    | 'getInputConnection'
  >;

export interface vtkPaintFilter extends vtkPaintFilterBase {
  /**
   * Add a point to the current stroke.
   * @param {Vector3} point world coordinates
   */
  addPoint(point: Vector3): void;

  /**
   * Write the current label into the label map wherever `maskBuffer` is set,
   * pushing the overwritten values onto the undo history.
   * @param maskBuffer binary mask, one byte per point of the label map
   */
  applyBinaryMask(maskBuffer: ArrayBuffer): void;

  /**
   * Replace the label map, recording the difference with the current one as a
   * single undoable step.
   * @param {vtkImageData} labelMap
   */
  applyLabelMap(labelMap: vtkImageData): void;

  /**
   * Whether there is a step available to redo.
   */
  canRedo(): boolean;

  /**
   * Whether there is a step available to undo.
   */
  canUndo(): boolean;

  /**
   * Terminate the current stroke and apply it to the label map. Returns
   * undefined when no stroke is in progress.
   */
  endStroke(): Promise<void> | undefined;

  /**
   * Get the image the voxel function is evaluated against.
   */
  getBackgroundImage(): Nullable<vtkImageData>;

  /**
   * Get the value written into the label map by the current stroke.
   */
  getLabel(): number;

  /**
   * Get the label map being painted into.
   */
  getLabelMap(): Nullable<vtkImageData>;

  /**
   * Get the transform used to convert the painted world coordinates into
   * label map indices.
   */
  getMaskWorldToIndex(): Nullable<mat4>;

  /**
   * Get the brush radius, in world units.
   */
  getRadius(): number;

  /**
   * Get the slicing mode restricting the paint operations to a single slice.
   */
  getSlicingMode(): Nullable<number>;

  /**
   * Get the predicate deciding, per voxel, whether the label is written.
   */
  getVoxelFunc(): Nullable<VoxelFunc>;

  /**
   * Paint the axis-aligned ellipse of the current stroke.
   * @param {Vector3} center world coordinates of the center
   * @param {Vector3} scale3 world coordinates of the semi-axes
   */
  paintEllipse(center: Vector3, scale3: Vector3): void;

  /**
   * Paint the triangulated polygon defined by a flat list of world coordinates.
   * @param {Number[]} pointList flattened xyz triplets
   */
  paintPolygon(pointList: number[]): void;

  /**
   * Paint the axis-aligned box spanned by two world points.
   * @param {Vector3} point1
   * @param {Vector3} point2
   */
  paintRectangle(point1: Vector3, point2: Vector3): void;

  /**
   * Re-apply the last undone step.
   */
  redo(): void;

  /**
   * Allocate the label map from the background image if needed and publish it
   * on the output port.
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;

  /**
   * Set the image the voxel function is evaluated against.
   * @param {vtkImageData} backgroundImage
   */
  setBackgroundImage(backgroundImage: vtkImageData): boolean;

  /**
   * Set the value written into the label map by the following strokes.
   * @param {Number} label
   */
  setLabel(label: number): boolean;

  /**
   * Set the label map being painted into. Setting it resets the undo history.
   * @param {vtkImageData} labelMap
   */
  setLabelMap(labelMap: vtkImageData): boolean;

  /**
   * Set the transform used to convert the painted world coordinates into
   * label map indices.
   * @param {mat4} maskWorldToIndex
   */
  setMaskWorldToIndex(maskWorldToIndex: mat4): boolean;

  /**
   * Set the brush radius, in world units.
   * @param {Number} radius
   */
  setRadius(radius: number): boolean;

  /**
   * Restrict the paint operations to a single slice along the given axis, or
   * pass null to paint in 3D.
   * @param {Number} slicingMode
   */
  setSlicingMode(slicingMode: Nullable<number>): boolean;

  /**
   * Set a predicate deciding, per voxel, whether the label is written.
   * @param {VoxelFunc} voxelFunc
   */
  setVoxelFunc(voxelFunc: Nullable<VoxelFunc>): boolean;

  /**
   * Start a new stroke. Paint operations are accumulated by a worker until
   * endStroke is called.
   */
  startStroke(): void;

  /**
   * Revert the last applied stroke.
   */
  undo(): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkPaintFilter characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IPaintFilterInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IPaintFilterInitialValues
): void;

/**
 * Method used to create a new instance of vtkPaintFilter
 * @param {IPaintFilterInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IPaintFilterInitialValues
): vtkPaintFilter;

/**
 * vtkPaintFilter - painting into a label map
 *
 * vtkPaintFilter is a source producing a label map, of the same geometry as the
 * background image, that is painted into with a brush. A stroke is opened with
 * startStroke, fed with addPoint, paintRectangle, paintEllipse or paintPolygon,
 * and committed with endStroke. Committed strokes can be reverted with undo and
 * reapplied with redo.
 */
export declare const vtkPaintFilter: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkPaintFilter;
