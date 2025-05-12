import vtkActor2D, { IActor2DInitialValues } from '../Actor2D';
import vtkTextProperty, { ITextPropertyInitialValues } from '../TextProperty';

export interface ITextActorInitialValues extends IActor2DInitialValues {
  property?: vtkTextProperty;
}

export interface vtkTextActor extends vtkActor2D {
  /**
   * Get the property object that controls this actors properties.
   * @returns {vtkTextProperty} The vtkTextProperty instance.
   */
  getProperty(): vtkTextProperty;

  /**
   * Create a new property suitable for use with this type of TextActor.
   * @param {ITextPropertyInitialValues} [initialValues] (default: {})
   * @return {vtkTextProperty} A new vtkTextProperty instance.
   */
  makeProperty(initialValues?: ITextPropertyInitialValues): vtkTextProperty;

  /**
   * Set the text to be displayed by the actor.
   * @param input The text to be displayed by the actor.
   */
  setInput(input: string): boolean;

  /**
   * Set the property object that controls this actors properties.
   * @param {vtkTextProperty} property The vtkTextProperty instance.
   */
  setProperty(property: vtkTextProperty): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkActor characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ITextActorInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ITextActorInitialValues
): void;

/**
 * Method used to create a new instance of vtkTextActor
 *
 * @param {ITextActorInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: ITextActorInitialValues
): vtkTextActor;

/**
 * vtkTextActor can be used to place text annotation into a window.
 */
export declare const vtkTextActor: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkTextActor;
