import vtkAbstractWidget from '../../../Widgets/Core/AbstractWidget';
import vtkCamera from '../../../Rendering/Core/Camera';
import vtkInteractiveOrientationWidget from '../InteractiveOrientationWidget';
import vtkOrientationMarkerWidget from '../../../Interaction/Widgets/OrientationMarkerWidget';
import vtkRenderer from '../../../Rendering/Core/Renderer';
import vtkRenderWindowInteractor from '../../../Rendering/Core/RenderWindowInteractor';
import vtkWidgetManager from '../../../Widgets/Core/WidgetManager';
import { vtkSubscription } from '../../../interfaces';
import { Bounds, Vector3 } from '../../../types';

export function majorAxis(
  vec3: Vector3,
  idxA: number,
  idxB: number
): [number, number, number];

/**
 * Create a new vtkOrientationMarkerWidget instance from the provided interactor and parentRenderer and sensible defaults.
 *
 * @param {vtkRenderWindowInteractor} interactor
 * @param {vtkRenderer} parentRenderer
 * @returns {vtkOrientationMarkerWidget}
 */
export function createOrientationMarkerWidget(
  interactor: vtkRenderWindowInteractor,
  parentRenderer: vtkRenderer
): vtkOrientationMarkerWidget;

/**
 * Create a new vtkInteractiveOrientationWidget instance and place it at the given bounds.
 *
 * @param {Bounds} bounds
 * @returns {vtkInteractiveOrientationWidget}
 */
export function createInteractiveOrientationWidget(
  bounds: Bounds
): vtkInteractiveOrientationWidget;

/**
 * Create a new vtkOrientationMarkerWidget alongside with a new vtkInteractiveOrientationWidget with sensible defaults.
 *
 * @param {vtkWidgetManager} widgetManager
 * @param {vtkRenderWindowInteractor} interactor
 * @param {vtkRenderer} mainRenderer
 * @returns {Object} the constructed widget instances
 */
export function createInteractiveOrientationMarkerWidget(
  widgetManager: vtkWidgetManager,
  interactor: vtkRenderWindowInteractor,
  mainRenderer: vtkRenderer
): {
  interactiveOrientationWidget: vtkInteractiveOrientationWidget;
  orientationMarkerWidget: vtkOrientationMarkerWidget;
};

/**
 * Listen to OrientationChange events on the given view widget.
 * The event handler will align the provided camera and update the provided vtkOrientationMarkerWidget instance.
 *
 * @param {vtkAbstractWidget} viewWidget Must be a vtkInteractiveOrientationWidget view widget
 * @param {vtkCamera} camera The camera instance to upate when orientation changes
 * @param {vtkOrientationMarkerWidget} orientationMarkerWidget The instance to update when orientation changes
 * @param {vtkWidgetManager} widgetManager
 * @param {Function} render A callback that should render the view
 * @returns {vtkSubscription} the corresponding event subscription, can be used to unsubscribe from the event
 */
export function alignCameraOnViewWidgetOrientationChange(
  viewWidget: vtkAbstractWidget,
  camera: vtkCamera,
  orientationMarkerWidget: vtkOrientationMarkerWidget,
  widgetManager: vtkWidgetManager,
  render: () => void
): vtkSubscription;
