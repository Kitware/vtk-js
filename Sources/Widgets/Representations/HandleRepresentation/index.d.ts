import vtkWidgetRepresentation, {
  IWidgetRepresentationInitialValues,
} from '../WidgetRepresentation';
import { Behavior } from '../WidgetRepresentation/Constants';

export interface IHandleRepresentationInitialValues extends IWidgetRepresentationInitialValues {
  behavior?: Behavior;
  pickable?: boolean;
  dragable?: boolean;
}

export interface vtkHandleRepresentation extends vtkWidgetRepresentation {}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkHandleRepresentation characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IHandleRepresentationInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IHandleRepresentationInitialValues
): void;

/**
 * vtkHandleRepresentation is the base class for widget representations that
 * render the interactive handles of a widget. It only defaults the
 * representation to the `HANDLE` behavior, makes it pickable and dragable and
 * enables display-space scaling.
 */
export declare const vtkHandleRepresentation: {
  extend: typeof extend;
};
export default vtkHandleRepresentation;
