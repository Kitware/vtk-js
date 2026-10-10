import { vtkWidgetState } from '../WidgetState';

export interface IVisibleInitialValues {
  visible?: boolean;
}

export interface vtkVisibleMixinState extends vtkWidgetState {
  /**
   * Get the visibility of the state.
   */
  getVisible(): boolean;

  /**
   * Get the visibility of the state. Alias of `getVisible`.
   */
  isVisible(): boolean;

  /**
   * Set the visibility of the state.
   *
   * @param {Boolean} visible
   */
  setVisible(visible: boolean): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with visibility
 * characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IVisibleInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IVisibleInitialValues
): void;

declare const vtkVisibleMixin: {
  extend: typeof extend;
};

export default vtkVisibleMixin;
