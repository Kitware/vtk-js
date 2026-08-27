import { Nullable } from '../../../types';
import {
  IRenderPassInitialValues,
  vtkRenderPass,
} from '../../SceneGraph/RenderPass';
import vtkWebGPURenderEncoder from '../RenderEncoder';
import vtkWebGPURenderer from '../Renderer';
import vtkWebGPURenderWindow from '../RenderWindow';
import vtkWebGPUTexture from '../Texture';
import vtkWebGPUTextureView from '../TextureView';

export interface IWebGPUOpaquePassInitialValues extends IRenderPassInitialValues {
  renderEncoder?: Nullable<vtkWebGPURenderEncoder>;
  colorTexture?: Nullable<vtkWebGPUTexture>;
  depthTexture?: Nullable<vtkWebGPUTexture>;
}

/**
 * `traverse` takes the renderer view node and the render window view node
 * here rather than the view node and parent of the base class, so the
 * inherited signature is replaced.
 */
type vtkWebGPUOpaquePassBase = Omit<vtkRenderPass, 'traverse'>;

export interface vtkWebGPUOpaquePass extends vtkWebGPUOpaquePassBase {
  /**
   * Render the opaque actors of a renderer into an offscreen color and depth
   * texture, allocating or resizing them to the canvas first.
   *
   * @param {vtkWebGPURenderer} renNode The renderer view node to traverse.
   * @param {vtkWebGPURenderWindow} viewNode The render window view node.
   */
  traverse(renNode: vtkWebGPURenderer, viewNode: vtkWebGPURenderWindow): void;

  /**
   * Get the view of the color texture this pass renders into.
   */
  getColorTextureView(): vtkWebGPUTextureView;

  /**
   * Get the view of the depth texture this pass renders into.
   */
  getDepthTextureView(): Nullable<vtkWebGPUTextureView>;

  /**
   * Create the render encoder the opaque actors are drawn with.
   */
  createRenderEncoder(): void;

  /**
   * Drop the render encoder and both textures so that they are recreated on
   * the next traversal.
   */
  releaseGraphicsResources(): void;

  /**
   * Get the rgba16float color texture this pass renders into, or `null`
   * before the first traversal.
   */
  getColorTexture(): Nullable<vtkWebGPUTexture>;

  /**
   * Get the depth32float texture this pass renders into, or `null` before the
   * first traversal.
   */
  getDepthTexture(): Nullable<vtkWebGPUTexture>;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUOpaquePass characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUOpaquePassInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUOpaquePassInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUOpaquePass.
 * @param {IWebGPUOpaquePassInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUOpaquePassInitialValues
): vtkWebGPUOpaquePass;

/**
 * vtkWebGPUOpaquePass renders the opaque geometry of a renderer into an
 * offscreen color and depth texture, which the translucent and volume passes
 * then composite onto.
 */
export declare const vtkWebGPUOpaquePass: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUOpaquePass;
