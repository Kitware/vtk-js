import { Nullable } from '../../../types';
import {
  IRenderPassInitialValues,
  vtkRenderPass,
} from '../../SceneGraph/RenderPass';
import vtkWebGPURenderEncoder from '../RenderEncoder';
import vtkWebGPURenderer from '../Renderer';
import vtkWebGPURenderWindow from '../RenderWindow';
import vtkWebGPUOpaquePass from '../OpaquePass';
import vtkWebGPUOrderIndependentTranslucentPass from '../OrderIndependentTranslucentPass';
import vtkWebGPUVolume from '../Volume';
import { vtkWebGPUVolumePass } from '../VolumePass';

export interface IWebGPUForwardPassInitialValues extends IRenderPassInitialValues {
  opaqueActorCount?: number;
  translucentActorCount?: number;
  volumes?: Nullable<vtkWebGPUVolume[]>;
  opaqueRenderEncoder?: Nullable<vtkWebGPURenderEncoder>;
  opaquePass?: vtkWebGPUOpaquePass;
  translucentPass?: Nullable<vtkWebGPUOrderIndependentTranslucentPass>;
  volumePass?: Nullable<vtkWebGPUVolumePass>;
}

export interface vtkWebGPUForwardPass extends vtkRenderPass {
  /**
   * Render every layer of every drawn renderer of the render window: query
   * the actors, run the opaque pass, then the translucent and volume passes
   * when the renderer holds any, and blit the result into the swap chain.
   *
   * @param {vtkWebGPURenderWindow} viewNode The render window view node.
   * @param parent (default: null)
   */
  traverse(viewNode: vtkWebGPURenderWindow, parent?: any): void;

  /**
   * Blit the opaque pass color texture into the current swap chain texture.
   *
   * @param {vtkWebGPURenderWindow} viewNode The render window view node.
   * @param {vtkWebGPURenderer} renNode The renderer view node, used for its
   * scissor and viewport.
   */
  finalPass(viewNode: vtkWebGPURenderWindow, renNode: vtkWebGPURenderer): void;

  /**
   * Create the render encoder, sampler and full screen quad the final blit is
   * drawn with.
   *
   * @param {vtkWebGPURenderWindow} viewNode The render window view node.
   */
  createFinalBlitEncoder(viewNode: vtkWebGPURenderWindow): void;

  /**
   * Count one opaque actor for the current query pass, and return the count
   * before the increment.
   */
  incrementOpaqueActorCount(): number;

  /**
   * Count one translucent actor for the current query pass, and return the
   * count before the increment.
   */
  incrementTranslucentActorCount(): number;

  /**
   * Add a volume view node to the list the volume pass renders.
   * @param {vtkWebGPUVolume} volume The volume view node to render.
   */
  addVolume(volume: vtkWebGPUVolume): void;

  /**
   * Release the delegate passes and everything the final blit owns.
   */
  releaseGraphicsResources(): void;

  /**
   * Get the opaque pass, or `undefined` before the first traversal.
   */
  getOpaquePass(): vtkWebGPUOpaquePass | undefined;

  /**
   * Set the opaque pass.
   */
  setOpaquePass(opaquePass: vtkWebGPUOpaquePass): boolean;

  /**
   * Get the translucent pass, or `null` while no renderer has held any
   * translucent actor.
   */
  getTranslucentPass(): Nullable<vtkWebGPUOrderIndependentTranslucentPass>;

  /**
   * Set the translucent pass.
   */
  setTranslucentPass(
    translucentPass: vtkWebGPUOrderIndependentTranslucentPass
  ): boolean;

  /**
   * Get the volume pass, or `null` while no renderer has held any volume.
   */
  getVolumePass(): Nullable<vtkWebGPUVolumePass>;

  /**
   * Set the volume pass.
   */
  setVolumePass(volumePass: vtkWebGPUVolumePass): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUForwardPass characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUForwardPassInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUForwardPassInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUForwardPass.
 * @param {IWebGPUForwardPassInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUForwardPassInitialValues
): vtkWebGPUForwardPass;

/**
 * vtkWebGPUForwardPass implements a forward rendering pipeline. Every layer of
 * every drawn renderer is rendered opaque first, into an offscreen color and
 * depth texture, so that the translucent and volume passes can be composited
 * against a valid z-buffer before the result is blitted into the swap chain.
 */
export declare const vtkWebGPUForwardPass: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUForwardPass;
