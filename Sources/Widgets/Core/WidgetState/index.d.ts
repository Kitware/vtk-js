import { vtkObject } from "../../../interfaces";

export interface vtkWidgetState extends vtkObject {
  /**
   * Set the active flag of the widget state instance
   * 
   * @param active The active flag
   */
  setActive(active: boolean): boolean;

  /**
   * Get the active flag of the widget state instance
   */
  getActive(): boolean;

  /**
   * Bind a state to one or more labels. If no label is provided, the default one will be used.
   * 
   * @param {vtkWidgetState} subState The state to bound.
   * @param {String | String[]} [labels] The labels to which the state should be bound.
   */
  bindState(subState: vtkWidgetState, labels?: string | string[]): void;

  /**
   * Unbind a specific state from the widget state instance
   * 
   * @param {vtkWidgetState} subState The state to be unbound.
   */
  unbindState(subState: vtkWidgetState): void;

  /**
   * Unbind all states from the widget state instance
   */
  unbindAll(): void;

  /**
   * Activate the widget state instance. Same as calling `vtkWidgetState.setActive(true)`
   */
  activate(): void;

  /**
   * Deactivate thie widget state instance and all its sub states, except the `excludingState` argument.
   * 
   * @param {vtkWidgetState} [excludingState] A sub-state instance that should not be deactivated.
   */
  deactivate(excludingState?: vtkWidgetState): void;

  /**
   * Activate only the passed in sub state. Every other sub states will be deactivated.
   * 
   * @param {vtkWidgetState} subState The sub-state that should be activated.
   */
  activateOnly(subState: vtkWidgetState): void;

  /**
   * Get every states that are associated with the given label.
   * 
   * @param {String} label The label from which to retrieve the states.
   */
  getStatesWithLabel(label: string): vtkWidgetState[];

  /**
   * Get all the nested states on the widget state instance.
   */
  getAllNestedStates(): vtkWidgetState[];
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkWidgetState characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {object} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: object): vtkWidgetState;

export declare const vtkWidgetState: {
  extend: typeof extend;
};

export default vtkWidgetState;
