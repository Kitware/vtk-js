import vtkAbstractWidgetFactory from "../../Core/AbstractWidgetFactory";
import { Bounds } from "../../../types";
import { ViewTypes } from "../../Core/WidgetManager/Constants";

export interface vtkInteractiveOrientationWidget extends vtkAbstractWidgetFactory {
  /**
   * Set the widget bounds
   * 
   * @param {Bounds} bounds The widget bounds
   */
  setBounds(bounds: Bounds): void;

  /**
   * @param {ViewTypes} viewType
   */
  getRepresentationForViewType(viewType: ViewTypes): unknown;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkInteractiveOrientationWidget characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {object} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues? : Record<string, unknown>): void;

/**
 * Creates a new instance of vtkInteractiveOrientationWidget
 * 
 * @param {object} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues? : Record<string, unknown>): vtkInteractiveOrientationWidget;

export declare const vtkInteractiveOrientationWidget: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};

export default vtkInteractiveOrientationWidget;
