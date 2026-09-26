import { vtkRenderer } from '../Renderer';
import { vtkRenderWindowInteractor } from '../RenderWindowInteractor';
import { vtkObject, EventHandler, vtkSubscription } from '../../../interfaces';
import { Nullable, Vector3 } from '../../../types';

export interface IInteractorObserverInitialValues {
  enabled?: boolean;
  priority?: number;
  processEvents?: boolean;
}

export interface vtkInteractorObserver extends vtkObject {
  /**
   * Invoke an interaction event.
   *
   * @param args Event payload.
   */
  invokeInteractionEvent(...args: unknown[]): void;

  /**
   * Registers a callback to be invoked when an interaction event occurs.
   *
   * @param {EventHandler} cb The callback to be called.
   * @param {Number} [priority] The priority of the event.
   */
  onInteractionEvent(
    cb: EventHandler,
    priority?: number
  ): Readonly<vtkSubscription>;

  /**
   * Invoke a start interaction event.
   *
   * @param args Event payload.
   */
  invokeStartInteractionEvent(...args: unknown[]): void;

  /**
   * Registers a callback to be invoked when a start interaction event occurs.
   *
   * @param {EventHandler} cb The callback to be called.
   * @param {Number} [priority] The callback to be called
   */
  onStartInteractionEvent(
    cb: EventHandler,
    priority?: number
  ): Readonly<vtkSubscription>;

  /**
   * Invoke an end interaction event.
   *
   * @param args Event payload.
   */
  invokeEndInteractionEvent(...args: unknown[]): void;

  /**
   * Registers a callback to be invoked when an end interaction event occurs.
   *
   * @param {EventHandler} cb The callback to be called.
   * @param {Number?} [priority] The callback to be called
   */
  onEndInteractionEvent(
    cb: EventHandler,
    priority?: number
  ): Readonly<vtkSubscription>;

  /**
   * Retrieve the render window interactor instance.
   */
  getInteractor(): vtkRenderWindowInteractor;

  /**
   * Get wether or not this InteractorObserver instance is enabled.
   */
  getEnabled(): boolean;

  /**
   * Enable/disable the interactor observer. Note that if you are enabling the interactor observer, an interactor instance must exists on the model.
   * Typically you can call `setInteractor`
   *
   * @param {Boolean} enable
   */
  setEnabled(enable: boolean): void;

  /**
   * Set the priority.
   *
   * @param {Number} priority The priority level.
   */
  setPriority(priority: number): void;

  /**
   * Get the priority.
   */
  getPriority(): number;

  /**
   * Set whether or not the interactor observer instance should process events.
   *
   * @param {Boolean} processEvents
   */
  setProcessEvents(processEvents: boolean): boolean;

  /**
   * Get whether or not the interactor observer instance should process events.
   */
  getProcessEvents(): boolean;

  /**
   * Set the interactor instance.
   *
   * @param {vtkRenderWindowInteractor} interactor
   */
  setInteractor(interactor: vtkRenderWindowInteractor): void;

  /**
   * Transform from world to display coordinates.
   *
   * @param {vtkRenderer} renderer The vtkRenderer instance.
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   */
  computeWorldToDisplay(
    renderer: vtkRenderer,
    x: number,
    y: number,
    z: number
  ): Nullable<Vector3>;

  /**
   * Transform from display to world coordinates.
   *
   * @param {vtkRenderer} renderer The vtkRenderer instance.
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   */
  computeDisplayToWorld(
    renderer: vtkRenderer,
    x: number,
    y: number,
    z: number
  ): Nullable<Vector3>;
}

/**
 * Transform from world to display coordinates.
 *
 * @param {vtkRenderer} renderer The vtkRenderer instance.
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 */
declare function computeWorldToDisplay(
  renderer: vtkRenderer,
  x: number,
  y: number,
  z: number
): Vector3;

/**
 * Transform from display to world coordinates.
 *
 * @param {vtkRenderer} renderer The vtkRenderer instance.
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 */
declare function computeDisplayToWorld(
  renderer: vtkRenderer,
  x: number,
  y: number,
  z: number
): Vector3;

/**
 * Method used to decorate a given object (publicAPI+model) with
 * vtkInteractorObserver characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IInteractorObserverInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IInteractorObserverInitialValues
): void;

/**
 * Method used to create a new instance of vtkInteractorObserver.
 * @param {IInteractorObserverInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IInteractorObserverInitialValues
): vtkInteractorObserver;

declare const _default: {
  newInstance: typeof newInstance;
  extend: typeof extend;
  computeWorldToDisplay: typeof computeWorldToDisplay;
  computeDisplayToWorld: typeof computeDisplayToWorld;
};
export declare const STATIC: Readonly<{
  computeWorldToDisplay: typeof computeWorldToDisplay;
  computeDisplayToWorld: typeof computeDisplayToWorld;
}>;
export default _default;
