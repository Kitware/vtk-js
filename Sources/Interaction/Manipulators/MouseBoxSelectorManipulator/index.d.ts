import vtkCompositeMouseManipulator, {
  ICompositeMouseManipulatorInitialValues,
} from '../CompositeMouseManipulator';
import { EventHandler, vtkObject, vtkSubscription } from '../../../interfaces';
import { Nullable } from '../../../types';

export interface vtkMouseBoxSelectorManipulator
  extends vtkObject,
    vtkCompositeMouseManipulator {
  /**
   * Invokes a box select change event.
   */
  invokeBoxSelectChange(data: unknown): void;

  /**
   * Registers a callback when a box select change event occurs.
   * @param cb EventHandler
   */
  onBoxSelectChange(cb: EventHandler): vtkSubscription;

  /**
   * Invokes a box select input event.
   */
  invokeBoxSelectInput(data: unknown): void;

  /**
   * Registers a callback when a box select input event occurs.
   * @param cb EventHandler
   */
  onBoxSelectInput(cb: EventHandler): vtkSubscription;

  /**
   * Sets whether to render the selection.
   * @param render
   */
  setRenderSelection(render: boolean): boolean;

  /**
   * Get whether to render the selection.
   */
  getRenderSelection(): boolean;

  /**
   * Sets the selection box style.
   * @param style
   */
  setSelectionStyle(style: Record<string, string>): boolean;

  /**
   * Gets the selection box style.
   */
  getSelectionStyle(): Record<string, string>;

  /**
   * Sets the box container.
   * @param container
   */
  setContainer(container: Element): boolean;

  /**
   * Gets the box container.
   */
  getContainer(): Nullable<Element>;
}

export interface IMouseBoxSelectorManipulatorInitialValues
  extends ICompositeMouseManipulatorInitialValues {
  renderSelection?: boolean;
  selectionStyle?: Record<string, string>;
  container?: Element;
}

export function newInstance(
  initialValues?: IMouseBoxSelectorManipulatorInitialValues
): vtkMouseBoxSelectorManipulator;

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IMouseBoxSelectorManipulatorInitialValues
): void;

export const vtkMouseBoxSelectorManipulator: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkMouseBoxSelectorManipulator;
