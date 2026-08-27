import { Nullable } from '../../../types';
import { vtkTexture } from '../../Core/Texture';
import { vtkRenderPass } from '../../SceneGraph/RenderPass';
import { IViewNodeInitialValues, vtkViewNode } from '../../SceneGraph/ViewNode';
import vtkWebGPUCamera from '../Camera';
import vtkWebGPUDevice from '../Device';
import vtkWebGPUFullScreenQuad from '../FullScreenQuad';
import vtkWebGPUTexture from '../Texture';
import vtkWebGPUTextureView from '../TextureView';
import vtkWebGPUUniformBuffer from '../UniformBuffer';

export interface IWebGPUSkyboxInitialValues extends IViewNodeInitialValues {
  backgroundInterpolate?: Nullable<string>;
  backgroundTextureView?: Nullable<vtkWebGPUTextureView>;
  backgroundWebGPUTexture?: Nullable<vtkWebGPUTexture>;
  boxInterpolate?: Nullable<string>;
  boxTextureView?: Nullable<vtkWebGPUTextureView>;
  boxWebGPUTexture?: Nullable<vtkWebGPUTexture>;
  lastFormat?: Nullable<string>;
  quad?: Nullable<vtkWebGPUFullScreenQuad>;
  UBO?: Nullable<vtkWebGPUUniformBuffer>;
  webgpuCamera?: Nullable<vtkWebGPUCamera>;
}

export interface vtkWebGPUSkybox extends vtkViewNode {
  /**
   * Builds myself: resolve the renderer and render window and find the view
   * node of the renderer's active camera.
   * @param prepass
   */
  buildPass(prepass: boolean): void;

  /**
   * @param prepass
   * @param {vtkRenderPass} renderPass
   */
  queryPass(prepass: boolean, renderPass: vtkRenderPass): void;

  /**
   * Create the full screen quad, its uniform buffer and its shader
   * replacements, if they do not exist yet.
   * @param {vtkWebGPUDevice} device
   */
  ensureQuad(device: vtkWebGPUDevice): void;

  /**
   * The first texture of the renderable, if any.
   */
  getTexture(): Nullable<vtkTexture>;

  /**
   * The cache key of the cube map built from the six inputs of the given
   * texture, or null when one of them is missing.
   * @param {vtkTexture} texture
   */
  getCubeTextureHash(texture: vtkTexture): Nullable<string>;

  /**
   * Get, or build and cache on the device, the cube map texture for the given
   * vtkTexture.
   * @param {vtkWebGPUDevice} device
   * @param {vtkTexture} texture
   */
  getCubeTexture(
    device: vtkWebGPUDevice,
    texture: vtkTexture
  ): Nullable<vtkWebGPUTexture>;

  /**
   * Bind the texture view matching the renderable's format to the quad.
   * Returns false when no texture is ready to be drawn.
   * @param {vtkWebGPUDevice} device
   */
  updateTexture(device: vtkWebGPUDevice): boolean;

  /**
   * Update and send the mapper uniform buffer holding the inverse projection
   * matrix and the stabilized camera position.
   * @param {vtkWebGPUDevice} device
   */
  updateUBO(device: vtkWebGPUDevice): void;

  /**
   * Drop the quad, the uniform buffer and the cached texture views.
   */
  releaseGraphicsResources(): void;

  /**
   * Renders myself: draw the full screen quad with the skybox shader for the
   * renderable's format.
   * @param prepass
   */
  opaquePass(prepass: boolean): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUSkybox characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUSkyboxInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUSkyboxInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUSkybox.
 * @param {IWebGPUSkyboxInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUSkyboxInitialValues
): vtkWebGPUSkybox;

/**
 * The WebGPU backend view node for a vtkSkybox.
 */
export declare const vtkWebGPUSkybox: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUSkybox;
