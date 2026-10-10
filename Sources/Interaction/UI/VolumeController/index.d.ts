import { vtkObject, vtkSubscription } from '../../../interfaces';
import { Nullable, Size } from '../../../types';
import { vtkPiecewiseGaussianWidget } from '../../Widgets/PiecewiseGaussianWidget';
import vtkRenderWindow from '../../../Rendering/Core/RenderWindow';
import vtkVolume from '../../../Rendering/Core/Volume';

export interface IVolumeControllerInitialValues {
  /**
   * Size in pixels of the embedded piecewise function editor.
   */
  size?: Size;
  expanded?: boolean;
  rescaleColorMap?: boolean;
}

export interface vtkVolumeController extends vtkObject {
  getActor(): Nullable<vtkVolume>;

  setActor(actor: vtkVolume): boolean;

  getRenderWindow(): Nullable<vtkRenderWindow>;

  setRenderWindow(renderWindow: vtkRenderWindow): boolean;

  getRescaleColorMap(): boolean;

  /**
   * When true, the color transfer function mapping range follows the opacity
   * range selected in the piecewise function editor.
   * @param {Boolean} value
   */
  setRescaleColorMap(value: boolean): boolean;

  /**
   * The embedded piecewise gaussian widget used to edit the scalar opacity.
   */
  getWidget(): vtkPiecewiseGaussianWidget;

  /**
   * Build the controller DOM content and wire it to the given volume actor.
   * @param {vtkRenderWindow} renderWindow
   * @param {vtkVolume} actor
   * @param {Boolean} isBackgroundDark selects the light or dark widget styling
   * @param {String|Number} [useShadow] (default: '1')
   * @param {String} [presetName] (default: 'erdc_rainbow_bright')
   */
  setupContent(
    renderWindow: vtkRenderWindow,
    actor: vtkVolume,
    isBackgroundDark: boolean,
    useShadow?: string | number,
    presetName?: string
  ): void;

  /**
   * Attach the controller to the given DOM element, detaching it from any
   * previously set one.
   * @param el
   */
  setContainer(el: Nullable<HTMLElement>): void;

  /**
   * Show or hide everything but the toggle button.
   */
  toggleVisibility(): void;

  getExpanded(): boolean;

  setExpanded(expanded: boolean): void;

  /**
   * Resize the embedded piecewise function editor.
   * @param {Number} width
   * @param {Number} height
   */
  setSize(width: number, height: number): void;

  /**
   * Render the embedded piecewise function editor.
   */
  render(): void;

  onAnimation(cb: (animating: boolean) => void): vtkSubscription;
}

/**
 * Method used to decorate a given object (publicAPI+model) with
 * vtkVolumeController characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IVolumeControllerInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IVolumeControllerInitialValues
): void;

/**
 * Method used to create a new instance of vtkVolumeController.
 * @param {IVolumeControllerInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IVolumeControllerInitialValues
): vtkVolumeController;

/**
 * vtkVolumeController is a DOM overlay providing interactive control over a
 * volume actor: color map preset, shading, sample distance, edge gradient
 * opacity and a piecewise gaussian editor for the scalar opacity.
 */
export declare const vtkVolumeController: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkVolumeController;
