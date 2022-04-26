import vtkAbstractWidget from "../AbstractWidget";
import vtkRenderer from "../../../Rendering/Core/Renderer";
import vtkWidgetState from "../WidgetState";
import { ViewTypes } from "../WidgetManager/Constants";
import { Bounds, Nullable } from "../../../types";
import { EventHandler, vtkSubscription } from "../../../interfaces";

export interface IGetWidgetForViewParams {
  viewId: number;
  renderer?: vtkRenderer;
  viewType?: ViewTypes;
  initialValues?: object;
}

export interface vtkAbstractWidgetFactory {
  /**
   * Will return the widget associated with the view with Id id `locator.viewId`. 
   * If there is no widget associated with the view, a new widget will be constructed, provided
   * that the renderer, viewType, and optionally initialValues are also provided.
   * 
   * @param {IGetWidgetForViewParams} locator
   */
  getWidgetForView(locator: IGetWidgetForViewParams): Nullable<vtkAbstractWidget>;

  /**
   * Get a list of all the view ids.
   */
  getViewIds(): string[];

  /**
   * Set the visiblity on each underlying view widget.
   * 
   * @param {Boolean} visible
   */
  setVisibility(visible: boolean): void 

  /**
   * Set the pickable flag for each underlying view widget.
   * 
   * @param {Boolean} pickable 
   */
  setPickable(pickable: boolean): void

  /**
   * Set the dragable flag for each underlying view widget.
   * 
   * @param {Boolean} dragable 
   */
  setDragable(dragable: boolean): void

  /**
   * Set the context visibility for each associated view widget.
   * 
   * @param {Boolean} visible 
   */
  setContextVisibility(visible: boolean): void

  /**
   * Set the handles visibility for each underlying view widget.
   * 
   * @param {Boolean} visible 
   */
  setHandleVisiblity(visible: boolean): void

  /**
   * Place a new widget at the given bounds.
   * 
   * @param {Bounds} bounds 
   */
  placeWidget(bounds: Bounds);

  /**
   * Get the place factor.
   */
  getPlaceFactor(): number;

  /**
   * Set the place factor.
   * 
   * @param {Number} factor 
   */
  setPlaceFactor(factor: number): void;

  /**
   * Get the `vtkWidgetState` instance
   */
  getWidgetState(): vtkWidgetState;

  /**
   * Register a callback to be called when the WidgetChange event arise.
   * 
   * @param {EventHandler} cb The callback to be invoked.
   * @param {Number} [priority] The priority of this subscription
   */
  onWidgetChangeEvent(cb: EventHandler, priority?: number): Readonly<vtkSubscription>;

  /**
   * Invoke the WidgetChange event
   * 
   * @param args The event payload
   */
  invokeWidgetChangeEvent(...args: unknown[]): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkAbstractWidgetFactory characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param initialValues (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues? : object): void;

/**
 * Method used to create a new instance of vtkAbstractWidgetFactory
 * 
 * @param initialValues for pre-setting some of its content
 */
export function newInstance(initialValues?: object): vtkAbstractWidgetFactory;

export declare const vtkAbstractWidgetFactory: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};

export default vtkAbstractWidgetFactory;
