import vtkWidgetRepresentation, {
  IWidgetRepresentationInitialValues,
} from '../WidgetRepresentation';
import { Behavior } from '../WidgetRepresentation/Constants';

export interface IContextRepresentationInitialValues extends IWidgetRepresentationInitialValues {
  behavior?: Behavior;
  pickable?: boolean;
  dragable?: boolean;
}

export interface vtkContextRepresentation extends vtkWidgetRepresentation {}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkContextRepresentation characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IContextRepresentationInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IContextRepresentationInitialValues
): void;

/**
 * vtkContextRepresentation is the base class for widget representations that
 * render the non-interactive context of a widget. It only defaults the
 * representation to the `CONTEXT` behavior and makes it non-pickable.
 */
export declare const vtkContextRepresentation: {
  extend: typeof extend;
};
export default vtkContextRepresentation;
