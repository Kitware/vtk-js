import { vtkWidgetState } from '../WidgetState';

export interface IScale1InitialValues {
  scale1?: number;
}

export interface vtkScale1MixinState extends vtkWidgetState {
  /**
   * Get the uniform scale of the state.
   */
  getScale1(): number;

  /**
   * Set the uniform scale of the state.
   *
   * @param {Number} scale
   */
  setScale1(scale: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with a uniform
 * scale.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IScale1InitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IScale1InitialValues
): void;

declare const vtkScale1Mixin: {
  extend: typeof extend;
};

export default vtkScale1Mixin;
