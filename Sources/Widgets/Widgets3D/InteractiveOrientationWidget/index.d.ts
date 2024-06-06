import {
  vtkAbstractWidgetFactory,
  IAbstractWidgetFactoryInitialValues,
} from '../../Core/AbstractWidgetFactory';
import vtkAbstractWidget from '../../Core/AbstractWidget';
import { Bounds } from '../../../types';
import { ViewTypes } from '../../Core/WidgetManager/Constants';

export interface vtkInteractiveOrientationWidget<
  WidgetInstance extends vtkAbstractWidget = vtkAbstractWidget
> extends vtkAbstractWidgetFactory<WidgetInstance> {
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

export interface IInteractiveOrientationWidgetInitialValues<
  WidgetInstance extends vtkAbstractWidget
> extends IAbstractWidgetFactoryInitialValues<WidgetInstance> {}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkInteractiveOrientationWidget characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {object} [initialValues] (default: {})
 */
export function extend<WidgetInstance extends vtkAbstractWidget>(
  publicAPI: object,
  model: object,
  initialValues?: IInteractiveOrientationWidgetInitialValues<WidgetInstance>
): void;

/**
 * Creates a new instance of vtkInteractiveOrientationWidget
 *
 * @param {object} [initialValues] for pre-setting some of its content
 */
export function newInstance<
  WidgetInstance extends vtkAbstractWidget = vtkAbstractWidget
>(
  initialValues?: IInteractiveOrientationWidgetInitialValues<WidgetInstance>
): vtkInteractiveOrientationWidget<WidgetInstance>;

export declare const vtkInteractiveOrientationWidget: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkInteractiveOrientationWidget;
