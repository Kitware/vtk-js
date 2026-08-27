import { vtkWidgetState } from '../WidgetState';

export interface IShapeInitialValues {
  shape?: string;
}

export interface vtkShapeMixinState extends vtkWidgetState {
  /**
   * Get the shape used to represent the state.
   */
  getShape(): string;

  /**
   * Set the shape used to represent the state.
   */
  setShape(shape: string): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with a shape.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IShapeInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IShapeInitialValues
): void;

declare const vtkShapeMixin: {
  extend: typeof extend;
};

export default vtkShapeMixin;
