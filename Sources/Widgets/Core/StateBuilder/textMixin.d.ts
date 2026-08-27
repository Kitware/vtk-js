import { vtkWidgetState } from '../WidgetState';

export interface ITextInitialValues {
  text?: string;
}

export interface vtkTextMixinState extends vtkWidgetState {
  /**
   * Get the text associated with the state.
   */
  getText(): string;

  /**
   * Set the text associated with the state.
   */
  setText(text: string): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with a text label.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ITextInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ITextInitialValues
): void;

declare const vtkTextMixin: {
  extend: typeof extend;
};

export default vtkTextMixin;
