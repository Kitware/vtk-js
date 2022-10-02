import vtkInteractorObserver from '../../../Rendering/Core/InteractorObserver';
import vtkProp from '../../../Rendering/Core/Prop';
import vtkRenderer from "../../../Rendering/Core/Renderer";
import vtkWidgetManager from '../WidgetManager';
import vtkWidgetRepresentation from '../../Representations/WidgetRepresentation';
import vtkWidgetState from '../WidgetState';
import { Bounds } from "../../../types";
import { RenderingTypes } from "../WidgetManager/Constants";
import { EventHandler, vtkSubscription } from '../../../interfaces';

export interface vtkAbstractWidget extends vtkProp, vtkInteractorObserver {
  /**
   * Get the bounds of the widget
   */
  getBounds(): Bounds;

  /**
   * Get all representations of the widget.
   */
  getNestedProps(): vtkWidgetRepresentation[];

  /**
   * Activate a handle, identified by both a state and a representation.
   * Will also invoke appropriate events.
   * 
   * @param locator An object describing the handle to activate.
   */
  activateHandle(locator: { 
    selectedState: vtkWidgetState; 
    representation: vtkWidgetRepresentation; 
  }): void;

  /**
   * Deactivate all the handles on the widget instance.
   */
  deactivateAllHandles(): void;

  /**
   * Returns true if the widget instance holds the given actor, false otherwise.
   * 
   * @param {vtkProp} actor
   */
  hasActor(actor: vtkProp): boolean;

  /**
   * Make the widget instance grab the focus.
   * Should not be called directly or this will lead to unexpected behavior.
   * To grab the focus on a widget, one should call `vtkWidgetManager.grabFocus(widgetInstanceToGiveFocusTo)`
   */
  grabFocus(): void;

  /**
   * Make the widget instance release the focus.
   */
  loseFocus(): void;

  /**
   * Returns true if the widget instance holds the focus, false otherwise.
   */
  hasFocus(): boolean;

  /**
   * Place a widget at the given bounds.
   * 
   * @param {Bounds} bounds
   */
  placeWidget(bounds: Bounds): void;

  /**
   * Get the place factor.
   */
  getPlaceFactor(): number;

  /**
   * Set the place factor.
   * 
   * @param {Number} factor The place factor.
   */
  setPlaceFactor(factor: number): void;

  /**
   * Get the `vtkWidgetRepresentation` instance associated with the given `vtkActor` instance.
   * 
   * @param {vtkProp} actor 
   */
  getRepresentationFromActor(actor: vtkProp): vtkWidgetRepresentation;

  /**
   * Update all the widget representations for render.
   * 
   * @param {RenderingTypes} renderingType Default value if `RenderingTypes.FRONT_BUFFER` 
   */
  updateRepresentationForRender(renderingType: RenderingTypes): void;

  /**
   * Get all the underlyings view widgets.
   */
  getViewWidgets(): vtkAbstractWidget[];


  /**
   * Set the context visibility.
   * 
   * @param {Boolean} visible 
   */
  setContextVisibility(visible: boolean): void;

  /**
   * Get the context visibility.
   */
  getContextVisibility(): boolean;

  /**
   * Defines if the handles should be visible or not.
   * 
   * @param {Boolean} visible 
   */
  setHandleVisibility(visible: boolean): void;

  /**
   * Returns true if the handles are visible, false otherwise.
   */
  getHandleVisibility(): boolean;

  /**
   * Set the widget manager associated with the widget instance.
   * 
   * @param {vtkWidgetManager} wm The widget manager instance
   */
  setWidgetManager(wm: vtkWidgetManager): void;

  /**
   * Get the widget manager associated with the widget instance.
   */
  getWidgetManager(): vtkWidgetManager;

  /**
   * Get all the representations of the widget instance.
   */
  getRepresentations(): vtkWidgetRepresentation[];

  /**
   * Get the the state of the widget instance.
   */
  getWidgetState(): vtkWidgetState;

  /**
   * Register a callback to be invoked when the `ActivateHandle` event occurs.
   * 
   * @param {EventHandler} cb The callback to register
   * @param {Number} [priority] Priority of this subscription
   */
  onActivateHandle(cb: EventHandler, priority?: number): Readonly<vtkSubscription>;

  /**
   * Invoke the `ActivateHandle` event with the given payload.
   * 
   * @param args The event payload
   */
  invokeActivateHandle(...args: unknown[]): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkAbstractWidget characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param initialValues (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues? : object): void;

/**
 * Method used to create a new instance of vtkAbstractWidget
 * 
 * @param initialValues For pre-setting some of its content
 */
export function newInstance(initialValues?: object): vtkAbstractWidget;

/**
 * vtkAbstractWidget is an abstract class to construct a widget.
 */
export declare const vtkAbstractWidget: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};

export default vtkAbstractWidget;
