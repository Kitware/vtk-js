import { vtkWidgetState } from '../WidgetState';

export interface INameInitialValues {
  name?: string;
}

export interface vtkNameMixinState extends vtkWidgetState {
  /**
   * Get the name of the state.
   */
  getName(): string;

  /**
   * Set the name of the state.
   */
  setName(name: string): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with a name.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {INameInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: INameInitialValues
): void;

declare const vtkNameMixin: {
  extend: typeof extend;
};

export default vtkNameMixin;
