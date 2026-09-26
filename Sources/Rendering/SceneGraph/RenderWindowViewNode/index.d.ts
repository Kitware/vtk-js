import vtkHardwareSelector from '../../Core/HardwareSelector';
import vtkRenderer from '../../Core/Renderer';
import { Nullable, Vector2, Vector3 } from '../../../types';
import vtkViewNode, { IViewNodeInitialValues } from '../ViewNode';
import vtkViewNodeFactory from '../ViewNodeFactory';

/**
 *
 */
export interface IRenderWindowViewNodeInitialValues extends IViewNodeInitialValues {
  size?: Vector2;
  selector?: vtkHardwareSelector;
}

export interface vtkRenderWindowViewNode extends vtkViewNode {
  /**
   * Get the ratio between the width and the height of the render window.
   */
  getAspectRatio(): number;

  /**
   * Get the ratio between the width and the height of the renderer viewport.
   * @param {vtkRenderer} renderer The vtkRenderer instance.
   */
  getAspectRatioForRenderer(renderer: vtkRenderer): number;

  /**
   * Get the ratio between the size of the render window and the size of its
   * container.
   */
  getComputedDevicePixelRatio(): number;

  /**
   * Not implemented by this class, api specific subclasses provide it.
   */
  getContainerSize(): void;

  /**
   * Not implemented by this class, api specific subclasses provide it.
   * @param {Number} x1
   * @param {Number} y1
   * @param {Number} x2
   * @param {Number} y2
   */
  getPixelData(x1: number, y1: number, x2: number, y2: number): void;

  /**
   * Get the hardware selector of the render window, when a subclass created
   * one.
   */
  getSelector(): vtkHardwareSelector | undefined;

  /**
   * Get the size of the render window.
   */
  getSize(): Vector2;

  /**
   * Get the size of the render window without copying it.
   */
  getSizeByReference(): Vector2;

  /**
   * Returns null, api specific subclasses provide their own factory.
   */
  getViewNodeFactory(): Nullable<vtkViewNodeFactory>;

  /**
   * Get the center of the viewport.
   * @param {vtkRenderer} viewport The viewport vtk element.
   */
  getViewportCenter(viewport: vtkRenderer): Vector2;

  /**
   * Get the size of the viewport, in pixels.
   * @param {vtkRenderer} viewport The viewport vtk element.
   */
  getViewportSize(viewport: vtkRenderer): Vector2;

  /**
   * Not implemented by this class, api specific subclasses provide it.
   */
  createSelector(): void;

  /**
   *
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   */
  displayToLocalDisplay(x: number, y: number, z: number): Vector3;

  /**
   *
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   */
  displayToNormalizedDisplay(x: number, y: number, z: number): Vector3;

  /**
   *
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @param {vtkRenderer} renderer The vtkRenderer instance.
   */
  displayToWorld(
    x: number,
    y: number,
    z: number,
    renderer: vtkRenderer
  ): Vector3;

  /**
   * Check if a point is in the viewport.
   * @param {Number} x The x coordinate.
   * @param {Number} y The y coordinate.
   * @param {vtkRenderer} viewport The viewport vtk element.
   */
  isInViewport(x: number, y: number, viewport: vtkRenderer): boolean;

  /**
   *
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   */
  normalizedDisplayToDisplay(x: number, y: number, z: number): Vector3;

  /**
   *
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @param {vtkRenderer} renderer The vtkRenderer instance.
   */
  normalizedDisplayToViewport(
    x: number,
    y: number,
    z: number,
    renderer: vtkRenderer
  ): Vector3;

  /**
   *
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @param {vtkRenderer} renderer The vtkRenderer instance.
   */
  normalizedViewportToViewport(
    x: number,
    y: number,
    z: number,
    renderer: vtkRenderer
  ): Vector3;

  /**
   *
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @param {vtkRenderer} renderer The vtkRenderer instance.
   */
  viewToWorld(x: number, y: number, z: number, renderer: vtkRenderer): Vector3;

  /**
   *
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @param {vtkRenderer} renderer The vtkRenderer instance.
   */
  viewportToNormalizedDisplay(
    x: number,
    y: number,
    z: number,
    renderer: vtkRenderer
  ): Vector3;

  /**
   *
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @param {vtkRenderer} renderer The vtkRenderer instance.
   */
  viewportToNormalizedViewport(
    x: number,
    y: number,
    z: number,
    renderer: vtkRenderer
  ): Vector3;

  /**
   *
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @param {vtkRenderer} renderer The vtkRenderer instance.
   */
  worldToDisplay(
    x: number,
    y: number,
    z: number,
    renderer: vtkRenderer
  ): Vector3;

  /**
   *
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   * @param {vtkRenderer} renderer The vtkRenderer instance.
   */
  worldToView(x: number, y: number, z: number, renderer: vtkRenderer): Vector3;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkRenderWindowViewNode characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IRenderWindowViewNodeInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IRenderWindowViewNodeInitialValues
): void;

/**
 * Method used to create a new instance of vtkRenderWindowViewNode.
 * @param {IRenderWindowViewNodeInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IRenderWindowViewNodeInitialValues
): vtkRenderWindowViewNode;

/**
 * vtkRenderWindowViewNode is intended to be a superclass for all api specific
 * RenderWindows. It is intended to define a common API that can be invoked
 * upon an api specific render window and provide some common method
 * implementations. If your application requires communicating with an api
 * specific view try to limit such interactions to methods defined in this
 * class.
 */
export declare const vtkRenderWindowViewNode: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkRenderWindowViewNode;
