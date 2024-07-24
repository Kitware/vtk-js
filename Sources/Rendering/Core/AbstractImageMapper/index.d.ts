import vtkAbstractMapper3D, {
  IAbstractMapper3DInitialValues,
} from '../AbstractMapper3D';
import vtkImageData from '../../../Common/DataModel/ImageData';
import { Bounds, Extent, Nullable, RGBAColor } from '../../../types';

export interface IAbstractImageMapperInitialValues
  extends IAbstractMapper3DInitialValues {
  customDisplayExtent?: number[];
  useCustomExtents?: boolean;
  slice?: number;
}

export interface vtkAbstractImageMapper extends vtkAbstractMapper3D {
  /**
   *
   */
  getIsOpaque(): boolean;

  /**
   * Return currently active image for the mapper. Overridden by deriving classes.
   */
  getCurrentImage(): Nullable<vtkImageData>;

  /**
   * Get the slice index.
   */
  getSlice(): number;

  /**
   *
   * @param {Number} slice The slice index.
   */
  setSlice(slice: number): boolean;

  /**
   * Get bounds for a specified slice.
   * To be implemented by derived classes.
   * @param {Number} slice The slice index. If undefined, the current slice is considered.
   * @param {Number} thickness The slice thickness. If undefined, 0 is considered.
   */
  getBoundsForSlice(slice?: number, thickness?: number): Bounds;

  /**
   * Return the currently set background color.
   */
  getBackgroundColor(): RGBAColor;

  /**
   * Return the currently set background color.
   */
  getBackgroundColorByReference(): RGBAColor;

  /**
   * @param r red component of background color
   * @param g green component of background color
   * @param b blue component of background color
   * @param a opacity component of background color
   */
  setBackgroundColor(r: number, g: number, b: number, a: number): boolean;

  /**
   *
   * @param color specify background color as an array of 4 values.
   */
  setBackgroundColor(color: RGBAColor): boolean;

  /**
   *
   * @param {RGBAColor} color specify the background color to use
   * in RGBA format as an array of 4 values. Values are copied.
   */
  setBackgroundColorFrom(color: RGBAColor): boolean;

  /**
   *
   */
  getUseCustomExtents(): boolean;

  /**
   *
   * @param {Boolean} useCustomExtents
   */
  setUseCustomExtents(useCustomExtents: boolean): boolean;

  /**
   *
   */
  getCustomDisplayExtent(): Extent;

  /**
   *
   */
  getCustomDisplayExtentByReference(): Extent;

  /**
   *
   * @param {Number} x1 The x coordinate of the first point.
   * @param {Number} x2 The x coordinate of the second point.
   * @param {Number} y1 The y coordinate of the first point.
   * @param {Number} y2 The y coordinate of the second point.
   * @param {Number} z1 The z coordinate of the first point.
   * @param {Number} z2 The z coordinate of the second point.
   */
  setCustomDisplayExtent(
    x1: number,
    x2: number,
    y1: number,
    y2: number,
    z1: number,
    z2: number
  ): boolean;

  /**
   *
   * @param extents specify extents as an array of 6 values [minx, maxx, ...]
   */
  setCustomDisplayExtent(customDisplayExtent: Extent): boolean;

  /**
   *
   * @param customDisplayExtent
   */
  setCustomDisplayExtentFrom(customDisplayExtent: number[]): boolean;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkAbstractImageMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IAbstractImageMapperInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IAbstractImageMapperInitialValues
): void;

/**
 * vtkImageMapper provides 2D image display support for vtk.
 * It can be associated with a vtkImageSlice prop and placed within a Renderer.
 *
 * This class resolves coincident topology with the same methods as vtkMapper.
 */
export declare const vtkAbstractImageMapper: {
  extend: typeof extend;
};
export default vtkAbstractImageMapper;
