import { vtkObject } from '../../../interfaces';
import { Nullable } from '../../../types';
import vtkRenderer from '../../Core/Renderer';
import vtkTexture from '../../Core/Texture';
import vtkWebGPUCamera from '../Camera';
import vtkWebGPUDevice from '../Device';
import vtkWebGPUFullScreenQuad from '../FullScreenQuad';
import vtkWebGPURenderEncoder from '../RenderEncoder';
import vtkWebGPURenderer from '../Renderer';
import vtkWebGPUUniformBuffer from '../UniformBuffer';

/**
 * How a renderer's background is drawn: a flat color, a vertical gradient
 * between the two background colors, a background texture, or the environment
 * texture sampled along the view direction.
 */
export type WebGPUBackgroundMode =
  | 'solid'
  | 'gradient'
  | 'texture'
  | 'environment';

/**
 * The background mode of a renderer, together with the texture it samples.
 */
export interface IWebGPUBackgroundDescription {
  mode: WebGPUBackgroundMode;

  /**
   * The texture sampled by the texture and environment modes, `null` for the
   * solid and gradient modes.
   */
  texture: Nullable<vtkTexture>;

  /**
   * The WGSL name the texture is bound under, `null` when there is none.
   */
  textureName: Nullable<string>;

  /**
   * The pipeline hash of the mode.
   */
  pipelineHash: string;
}

export interface IWebGPUBackgroundInitialValues {
  quad?: Nullable<vtkWebGPUFullScreenQuad>;
  UBO?: Nullable<vtkWebGPUUniformBuffer>;
  webgpuCamera?: Nullable<vtkWebGPUCamera>;
}

export interface vtkWebGPUBackground extends vtkObject {
  /**
   * Work out how a renderer's background must be drawn. A background or
   * environment texture is only used once its image has loaded, and a
   * gradient is only used when the two background colors differ.
   * @param {vtkRenderer} renderer The renderer to inspect.
   */
  getMode(renderer: vtkRenderer): IWebGPUBackgroundDescription;

  /**
   * Create the full screen quad and its uniform buffer, once.
   * @param device The device to create them on.
   */
  ensureQuad(device: vtkWebGPUDevice): void;

  /**
   * Get the fragment shader template of a background mode.
   * @param mode The background mode.
   */
  getFragmentTemplate(mode: WebGPUBackgroundMode): string;

  /**
   * Bind the texture of the current background mode to the quad, or clear the
   * bound views when there is no texture or it is not uploaded yet.
   * @param device The device the texture is created on.
   * @param texture The vtkTexture to bind, if any.
   * @param textureName The WGSL name to bind it under, if any.
   */
  updateTexture(
    device: vtkWebGPUDevice,
    texture: Nullable<vtkTexture>,
    textureName: Nullable<string>
  ): void;

  /**
   * Write the background colors and the full screen quad matrix into the
   * uniform buffer, and send it when it changed.
   * @param device The device to send the buffer to.
   * @param {vtkWebGPURenderer} rendererNode The renderer view node.
   * @param {vtkRenderer} renderer The renderer holding the colors.
   */
  updateUBO(
    device: vtkWebGPUDevice,
    rendererNode: vtkWebGPURenderer,
    renderer: vtkRenderer
  ): void;

  /**
   * Draw the background of a renderer into the given encoder.
   * @param {vtkWebGPURenderEncoder} renderEncoder The encoder to draw into.
   * @param {vtkWebGPURenderer} rendererNode The renderer view node.
   */
  render(
    renderEncoder: vtkWebGPURenderEncoder,
    rendererNode: vtkWebGPURenderer
  ): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUBackground characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUBackgroundInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUBackgroundInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUBackground.
 * @param {IWebGPUBackgroundInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUBackgroundInitialValues
): vtkWebGPUBackground;

/**
 * vtkWebGPUBackground draws the background of a renderer with a full screen
 * quad, picking the solid, gradient, texture or environment shader from the
 * renderer's own background settings.
 */
export declare const vtkWebGPUBackground: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUBackground;
