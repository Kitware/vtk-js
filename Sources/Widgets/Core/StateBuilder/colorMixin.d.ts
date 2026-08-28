import { vtkWidgetState } from '../WidgetState';

/**
 * Scalar color mixin. The scalar value in [0, 1] references a color in the
 * mapper lookup table. Not to be used in conjunction with the `color3` mixin.
 * @see color3Mixin
 */
export interface IColorInitialValues {
  color?: number;
}

export interface vtkColorMixinState extends vtkWidgetState {
  /**
   * Get the scalar color value in [0, 1].
   */
  getColor(): number;

  /**
   * Set the scalar color value in [0, 1].
   */
  setColor(color: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with a scalar color.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IColorInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IColorInitialValues
): void;

declare const vtkColorMixin: {
  extend: typeof extend;
};

export default vtkColorMixin;
