import vtkAbstractWidget from "../AbstractWidget";
import vtkRenderer from "../../../Rendering/Core/Renderer";
import vtkWidgetState from "../WidgetState";
import { ViewTypes } from "../WidgetManager/Constants";
import { Bounds, Nullable } from "../../../types";
import { EventHandler, vtkSubscription, vtkObject } from "../../../interfaces";

export interface IGetWidgetForViewParams {
  viewId: number;
  renderer?: vtkRenderer;
  viewType?: ViewTypes;
  initialValues?: object;
}

export interface vtkAbstractWidgetFactory<WidgetInstance extends vtkAbstractWidget> extends vtkObject {
  /**
   * Will return the widget associated with the view with Id id `locator.viewId`. 
   * If there is no widget associated with the view, a new widget will be constructed, provided
   * that the renderer, viewType, and optionally initialValues are also provided.
   * 
   * @param {IGetWidgetForViewParams} locator
   */
  getWidgetForView(locator: IGetWidgetForViewParams): Nullable<WidgetInstance>;

  /**
   * Get a list of all the view ids.
   */
  getViewIds(): string[];

  /**
   * Get a list of all the instances of the widget.
   */
  getViewWidgets(): vtkAbstractWidget[];

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
  placeWidget(bounds: Bounds): void;

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
 * This hack is to "remember" the generic type T that this function turn publicAPI into
 * This is because typescript is completely "structural" and doesn't have any way to declare "nominal" types
 * See: https://github.com/microsoft/TypeScript/issues/202
 * For example, in this code, widgetInstance is a vtkResliceCursorWidgetCPRInstance:
 * 
 * import vtkResliceCursorWidget from '@kitware/vtk.js/Widgets/Widgets3D/ResliceCursorWidget';
 * import widgetBehavior from '@kitware/vtk.js/Widgets/Widgets3D/ResliceCursorWidget/cprBehavior';
 *
 * const widget = vtkResliceCursorWidget.newInstance({
 *   planes: ['Y', 'Z'],
 *   behavior: widgetBehavior,
 * });
 * const widgetInstance = widgetManager.addWidget(widget);
 */
declare const ExtendSymbol: unique symbol;
export type ExtendWidgetBehavior<WidgetInstance> = ((publicAPI: object, model: object) => void) & { [ExtendSymbol]: WidgetInstance };

export interface IAbstractWidgetFactoryInitialValues<WidgetInstance extends vtkAbstractWidget = vtkAbstractWidget> {
  behavior?: ExtendWidgetBehavior<WidgetInstance>;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkAbstractWidgetFactory characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param initialValues (default: {})
 */
export function extend<WidgetInstance extends vtkAbstractWidget = vtkAbstractWidget>(publicAPI: object, model: object, initialValues?: IAbstractWidgetFactoryInitialValues<WidgetInstance>): void;

/**
 * Method used to create a new instance of vtkAbstractWidgetFactory
 * 
 * @param initialValues for pre-setting some of its content
 */
export function newInstance<WidgetInstance extends vtkAbstractWidget = vtkAbstractWidget>(initialValues?: IAbstractWidgetFactoryInitialValues<WidgetInstance>): vtkAbstractWidgetFactory<WidgetInstance>;

export declare const vtkAbstractWidgetFactory: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};

export default vtkAbstractWidgetFactory;
