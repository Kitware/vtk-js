import { Nullable } from '../../../types';
import type { vtkFramebuffer } from '../Framebuffer';
import vtkOpenGLTexture from '../Texture';
import {
  IRenderPassInitialValues,
  vtkRenderPass,
} from '../../SceneGraph/RenderPass';

/**
 *
 */
export interface IForwardPassInitialValues extends IRenderPassInitialValues {
  opaqueActorCount?: number;
  translucentActorCount?: number;
  volumeCount?: number;
  overlayActorCount?: number;
  framebuffer?: Nullable<vtkFramebuffer>;
  depthRequested?: boolean;
}

export interface vtkForwardPass extends vtkRenderPass {
  /**
   * Get the framebuffer the depth capture renders into, or `null` when no
   * depth capture has been needed yet.
   */
  getFramebuffer(): Nullable<vtkFramebuffer>;

  /**
   * Get the number of opaque actors seen by the last query pass.
   */
  getOpaqueActorCount(): number;

  /**
   * Get the number of translucent actors seen by the last query pass.
   */
  getTranslucentActorCount(): number;

  /**
   * Get the number of volumes seen by the last query pass.
   */
  getVolumeCount(): number;

  /**
   * Get the color texture holding the captured z-buffer, or `null`/`undefined`
   * when no depth capture has been needed yet.
   */
  getZBufferTexture(): Nullable<vtkOpenGLTexture> | undefined;

  /**
   * Ask for a z-buffer capture on the next traversal, whether or not the
   * scene mixes geometry and volumes.
   */
  requestDepth(): void;

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
   * Count one volume for the current query pass, and return the count before
   * the increment.
   */
  incrementVolumeCount(): number;

  /**
   * Count one overlay actor for the current query pass, and return the count
   * before the increment.
   */
  incrementOverlayActorCount(): number;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkForwardPass characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IForwardPassInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IForwardPassInitialValues
): void;

/**
 * Method used to create a new instance of vtkForwardPass.
 * @param {IForwardPassInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IForwardPassInitialValues
): vtkForwardPass;

/**
 * vtkForwardPass implements a forward rendering pipeline. When a renderer holds
 * both geometry and volumes, it first captures a z-buffer so the two can be
 * mixed, then renders the opaque, translucent, volume and overlay actors of
 * every renderer, layer by layer.
 */
declare const vtkForwardPass: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkForwardPass;
