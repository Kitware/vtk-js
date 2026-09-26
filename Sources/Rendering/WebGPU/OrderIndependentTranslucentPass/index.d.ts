import { Nullable } from '../../../types';
import {
  IRenderPassInitialValues,
  vtkRenderPass,
} from '../../SceneGraph/RenderPass';
import vtkWebGPURenderer from '../Renderer';
import vtkWebGPURenderWindow from '../RenderWindow';
import vtkWebGPUTexture from '../Texture';
import vtkWebGPUTextureView from '../TextureView';

export interface IWebGPUOrderIndependentTranslucentPassInitialValues extends IRenderPassInitialValues {
  colorTextureView?: Nullable<vtkWebGPUTextureView>;
  depthTextureView?: Nullable<vtkWebGPUTextureView>;
}

/**
 * `traverse` takes the renderer view node and the render window view node
 * here rather than the view node and parent of the base class, so the
 * inherited signature is replaced.
 */
type vtkWebGPUOrderIndependentTranslucentPassBase = Omit<
  vtkRenderPass,
  'traverse'
>;

export interface vtkWebGPUOrderIndependentTranslucentPass extends vtkWebGPUOrderIndependentTranslucentPassBase {
  /**
   * Accumulate the translucent actors of a renderer into the color and
   * revealage textures, then resolve them onto the color texture view set on
   * this pass.
   *
   * @param {vtkWebGPURenderer} renNode The renderer view node to traverse.
   * @param {vtkWebGPURenderWindow} viewNode The render window view node.
   */
  traverse(renNode: vtkWebGPURenderer, viewNode: vtkWebGPURenderWindow): void;

  /**
   * Draw the full screen quad resolving the two accumulation textures onto
   * the color texture view set on this pass.
   *
   * @param {vtkWebGPURenderWindow} viewNode The render window view node.
   * @param {vtkWebGPURenderer} renNode The renderer view node, used for its
   * scissor and viewport.
   */
  finalPass(viewNode: vtkWebGPURenderWindow, renNode: vtkWebGPURenderer): void;

  /**
   * Get the color and revealage accumulation textures, in that order.
   */
  getTextures(): vtkWebGPUTexture[];

  /**
   * Create the render encoder the translucent actors accumulate through,
   * including the shader replacement computing the depth weighting.
   */
  createRenderEncoder(): void;

  /**
   * Create the render encoder the resolve pass is drawn with.
   */
  createFinalEncoder(): void;

  /**
   * Drop both encoders, both accumulation textures and the full screen quad
   * so that they are recreated on the next traversal.
   */
  releaseGraphicsResources(): void;

  /**
   * Get the view of the texture the resolved color is drawn onto.
   */
  getColorTextureView(): Nullable<vtkWebGPUTextureView>;

  /**
   * Set the view of the texture the resolved color is drawn onto.
   */
  setColorTextureView(colorTextureView: vtkWebGPUTextureView): boolean;

  /**
   * Get the view of the depth texture the accumulation pass tests against.
   */
  getDepthTextureView(): Nullable<vtkWebGPUTextureView>;

  /**
   * Set the view of the depth texture the accumulation pass tests against.
   */
  setDepthTextureView(depthTextureView: vtkWebGPUTextureView): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUOrderIndependentTranslucentPass characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUOrderIndependentTranslucentPassInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUOrderIndependentTranslucentPassInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUOrderIndependentTranslucentPass.
 * @param {IWebGPUOrderIndependentTranslucentPassInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUOrderIndependentTranslucentPassInitialValues
): vtkWebGPUOrderIndependentTranslucentPass;

/**
 * vtkWebGPUOrderIndependentTranslucentPass renders translucent geometry with
 * weighted blended order-independent transparency. Color and revealage
 * accumulate into two floating point textures, which a full screen quad then
 * resolves onto the opaque pass color texture, so the result does not depend
 * on the order the translucent actors are drawn in.
 */
export declare const vtkWebGPUOrderIndependentTranslucentPass: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUOrderIndependentTranslucentPass;
