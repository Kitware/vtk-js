import vtkAbstractManipulator from '../../Manipulators/AbstractManipulator';
import { vtkWidgetState } from '../WidgetState';

export interface IManipulatorInitialValues {
  manipulator?: vtkAbstractManipulator | null;
}

export interface vtkManipulatorMixinState extends vtkWidgetState {
  /**
   * Get the manipulator bound to the state.
   */
  getManipulator(): vtkAbstractManipulator | null;

  /**
   * Set the manipulator bound to the state.
   */
  setManipulator(manipulator: vtkAbstractManipulator | null): boolean;

  /**
   * Push the state's `origin`, `normal` and `direction` onto the manipulator,
   * when the manipulator exposes the matching setters.
   */
  updateManipulator(): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with a manipulator.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IManipulatorInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IManipulatorInitialValues
): void;

declare const vtkManipulatorMixin: {
  extend: typeof extend;
};

export default vtkManipulatorMixin;
