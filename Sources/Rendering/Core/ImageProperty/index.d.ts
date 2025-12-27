import { vtkObject } from '../../../interfaces';
import { Extent, Nullable } from '../../../types';
import vtkColorTransferFunction from '../ColorTransferFunction';
import vtkPiecewiseFunction from '../../../Common/DataModel/PiecewiseFunction';
import { InterpolationType } from './Constants';

interface IComponentData {
  piecewiseFunction: number;
  componentWeight: number;
}

export interface IImagePropertyInitialValues {
  independentComponents?: boolean;
  interpolationType?: InterpolationType;
  colorWindow?: number;
  colorLevel?: number;
  ambient?: number;
  diffuse?: number;
  opacity?: number;
  componentData?: IComponentData[];
  useLookupTableScalarRange?: boolean;
  useLabelOutline?: boolean;
  labelOutlineThickness?: number | number[];
  labelOutlineOpacity?: number | number[];
}

export interface vtkImageProperty extends vtkObject {
  /**
   * Get the lighting coefficient.
   * @default 1.0
   */
  getAmbient(): number;

  /**
   * Get the level value for window/level.
   * @default 127.5
   */
  getColorLevel(): number;

  /**
   * Get the window value for window/level.
   * @default 255
   */
  getColorWindow(): number;

  /**
   *
   * @param {Number} index
   */
  getComponentWeight(index: number): number;

  /**
   * Get the diffuse lighting coefficient.
   * @default 1.0
   */
  getDiffuse(): number;

  /**
   *
   * @default false
   */
  getIndependentComponents(): boolean;

  /**
   * Get the interpolation type
   */
  getInterpolationType(): InterpolationType;

  /**
   * Get the interpolation type as a string
   */
  getInterpolationTypeAsString(): string;

  /**
   * Get the opacity of the object.
   * @default 1.0
   */
  getOpacity(): number;

  /**
   * Get the component weighting function.
   * @param {Number} [idx]
   */
  getPiecewiseFunction(idx?: number): Nullable<vtkPiecewiseFunction>;

  /**
   * Get the currently set RGB transfer function.
   * @param {Number} [idx]
   */
  getRGBTransferFunction(idx?: number): Nullable<vtkColorTransferFunction>;

  /**
   * Alias to get the piecewise function (backwards compatibility)
   * @param {Number} [idx]
   */
  getScalarOpacity(idx?: number): vtkPiecewiseFunction;

  /**
   * Enable label outline rendering.
   * @param {Boolean} useLabelOutline
   */
  setUseLabelOutline(useLabelOutline: boolean): boolean;

  /**
   * Check if label outline rendering.
   */
  getUseLabelOutline(): boolean;

  /**
   * Set opacity of the label outline.
   *
   * Opacity must be between 0 and 1.
   * If the given opacity is a number, the opacity will apply to all outline segments.
   * If the given opacity is an array of numbers, each opacity value will apply to the
   * label equal to the opacity value's index + 1. (This is the same behavior as setLabelOutlineThickness).
   *
   * @param {Number | Number[]} opacity
   */
  setLabelOutlineOpacity(opacity: number | number[]): boolean;

  /**
   * Get the 0 to 1 opacity of the label outline.
   */
  getLabelOutlineOpacity(): number | number[];

  /**
   * gets the label outline thickness
   */
  getLabelOutlineThickness(): number;

  /**
   * Get the label outline thickness array by reference.
   * This returns the actual internal array, not a copy.
   */
  getLabelOutlineThicknessByReference(): number[];

  /**
   * It will set the label outline thickness for the labelmaps. It can accept
   * a single number or an array of numbers. If a single number is provided,
   * it will be used for all the segments. If an array is provided, it indicates
   * the thickness for each segment index. For instance if you have a labelmap
   * with 3 segments (0: background 1: liver 2: tumor), you can set the thickness
   * to [2,4] to have a thicker outline for the tumor (thickness 4). It should be
   * noted that the thickness is in pixel and also the first array value will
   * control the default thickness for all labels when 0 or not specified.
   *
   * @param {Number | Number[]} labelOutlineThickness
   */
  setLabelOutlineThickness(labelOutlineThickness: number | number[]): boolean;

  /**
   * Set the ambient lighting coefficient.
   * @param {Number} ambient The ambient lighting coefficient.
   */
  setAmbient(ambient: number): boolean;

  /**
   * Set the level value for window/level.
   * @param {Number} colorLevel The level value for window/level.
   */
  setColorLevel(colorLevel: number): boolean;

  /**
   * Set the window value for window/level.
   * @param {Number} colorWindow The window value for window/level.
   */
  setColorWindow(colorWindow: number): boolean;

  /**
   *
   * @param {Number} index
   * @param {Number} value
   */
  setComponentWeight(index: number, value: number): boolean;

  /**
   * Set the diffuse lighting coefficient.
   * @param {Number} diffuse  The diffuse lighting coefficient.
   */
  setDiffuse(diffuse: number): boolean;

  /**
   *
   * @param {Boolean} independentComponents
   */
  setIndependentComponents(independentComponents: boolean): boolean;

  /**
   * Set the interpolation type.
   * @param {InterpolationType} interpolationType The interpolation type.
   */
  setInterpolationType(interpolationType: InterpolationType): boolean;

  /**
   * Set `interpolationType` to `InterpolationType.LINEAR`.
   */
  setInterpolationTypeToLinear(): boolean;

  /**
   * Set `interpolationType` to `InterpolationType.NEAREST`.
   */
  setInterpolationTypeToNearest(): boolean;

  /**
   * Set the opacity of the object
   * @param {Number} opacity The opacity value.
   */
  setOpacity(opacity: number): boolean;

  /**
   * Set the piecewise function
   * @param {Number} index
   * @param {vtkPiecewiseFunction} func
   */
  setPiecewiseFunction(
    index: number,
    func: Nullable<vtkPiecewiseFunction>
  ): boolean;

  /**
   * Set the color of a volume to an RGB transfer function
   * @param {Number} index
   * @param {vtkColorTransferFunction} func
   */
  setRGBTransferFunction(
    index: number,
    func: Nullable<vtkColorTransferFunction>
  ): boolean;

  /**
   * Alias to set the piecewise function
   * @param {Number} index
   * @param {vtkPiecewiseFunction} func
   */
  setScalarOpacity(
    index: number,
    func: Nullable<vtkPiecewiseFunction>
  ): boolean;

  /**
   * Use the range that is set on the lookup table, instead of setting the range from the
   * ColorWindow/ColorLevel settings
   * @default false
   * @param {Boolean} useLookupTableScalarRange
   */
  setUseLookupTableScalarRange(useLookupTableScalarRange: boolean): boolean;

  /**
   * Informs the mapper to only update the specified extents at the next render.
   *
   * If there are zero extents, the mapper updates the entire volume texture.
   * Otherwise, the mapper will only update the texture by the specified extents
   * during the next render call.
   *
   * This array is cleared after a successful render.
   * @param extents
   */
  setUpdatedExtents(extents: Extent[]): boolean;

  /**
   * Retrieves the updated extents.
   *
   * This array is cleared after every successful render.
   */
  getUpdatedExtents(): Extent[];
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkImageProperty characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IImagePropertyInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IImagePropertyInitialValues
): void;

/**
 * Method use to create a new instance of vtkImageProperty
 * @param {IImagePropertyInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IImagePropertyInitialValues
): vtkImageProperty;

/**
 * vtkImageProperty provides 2D image display support for vtk.
 * It can be associated with a vtkImageSlice prop and placed within a Renderer.
 *
 * This class resolves coincident topology with the same methods as vtkMapper.
 */
export declare const vtkImageProperty: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkImageProperty;
