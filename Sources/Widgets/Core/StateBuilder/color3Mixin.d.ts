import { RGBColor } from '../../../types';
import { vtkWidgetState } from '../WidgetState';

/**
 * RGB Uint8 color mixin. Not to be used in conjunction with the `color` mixin.
 * @see colorMixin
 */
export interface IColor3InitialValues {
  color3?: RGBColor;
  opacity?: number;
}

export interface vtkColor3MixinState extends vtkWidgetState {
  /**
   * Get a copy of the Uint8 RGB color.
   */
  getColor3(): RGBColor;

  /**
   * Get the Uint8 RGB color by reference.
   */
  getColor3ByReference(): RGBColor;

  /**
   * Set the Uint8 RGB color.
   */
  setColor3(color: RGBColor): boolean;
  setColor3(r: number, g: number, b: number): boolean;

  /**
   * Set the Uint8 RGB color by reference.
   */
  setColor3From(color: RGBColor): void;

  /**
   * Get the Uint8 opacity.
   */
  getOpacity(): number;

  /**
   * Set the Uint8 opacity.
   */
  setOpacity(opacity: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with a Uint8 RGB
 * color and opacity.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IColor3InitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IColor3InitialValues
): void;

declare const vtkColor3Mixin: {
  extend: typeof extend;
};

export default vtkColor3Mixin;
