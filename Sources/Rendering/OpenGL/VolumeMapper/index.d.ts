import { Nullable, Vector2 } from '../../../types';
import { vtkRenderer } from '../../Core/Renderer';
import { vtkVolume } from '../../Core/Volume';
import type { vtkFramebuffer } from '../Framebuffer';
import { vtkForwardPass } from '../ForwardPass';
import vtkOpenGLTexture from '../Texture';
import { vtkRenderPass } from '../../SceneGraph/RenderPass';
import { IViewNodeInitialValues, vtkViewNode } from '../../SceneGraph/ViewNode';

/**
 * The vertex, fragment and geometry sources a mapper assembles before the
 * shader program is compiled.
 */
export interface IShaderSources {
  Vertex: string;
  Fragment: string;
  Geometry: string;
}

/**
 *
 */
export interface IOpenGLVolumeMapperInitialValues extends IViewNodeInitialValues {
  context?: Nullable<WebGL2RenderingContext>;
  scalarTextures?: vtkOpenGLTexture[];
  opacityTexture?: Nullable<vtkOpenGLTexture>;
  colorTexture?: Nullable<vtkOpenGLTexture>;
  labelOutlineThicknessTexture?: Nullable<vtkOpenGLTexture>;
  jitterTexture?: Nullable<vtkOpenGLTexture>;
  tris?: any;
  framebuffer?: Nullable<vtkFramebuffer>;
  copyShader?: any;
  copyVAO?: any;

  /**
   * @default 1
   */
  lastXYF?: number;

  /**
   * @default 1
   */
  targetXYF?: number;

  zBufferTexture?: Nullable<vtkOpenGLTexture>;
  lastZBufferTexture?: Nullable<vtkOpenGLTexture>;

  /**
   * @default 1
   */
  fullViewportTime?: number;

  idxToView?: Nullable<Float64Array>;
  vecISToVCMatrix?: Nullable<Float64Array>;
  modelToView?: Nullable<Float64Array>;
  projectionToView?: Nullable<Float64Array>;

  /**
   * @default 0
   */
  avgWindowArea?: number;

  /**
   * @default 0
   */
  avgFrameTime?: number;
}

export interface vtkOpenGLVolumeMapper extends vtkViewNode {
  /**
   * Apply the shader replacements a renderable declares under its OpenGL view
   * specific properties.
   *
   * @param {IShaderSources} shaders The shader sources, edited in place.
   * @param viewSpec The OpenGL view specific properties of the renderable.
   * @param {Boolean} [pre] Apply the replacements marked `replaceFirst`.
   */
  applyShaderReplacements(
    shaders: IShaderSources,
    viewSpec: any,
    pre?: boolean
  ): void;

  /**
   * Build the scalar, color, opacity and label outline textures, and the
   * vertex buffer of the box the volume is ray cast through.
   *
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkVolume} actor The volume being rendered.
   */
  buildBufferObjects(ren: vtkRenderer, actor: vtkVolume): void;

  /**
   * Drop the z-buffer texture captured by a previous traversal.
   */
  buildPass(): void;

  /**
   * Assemble the shader sources, applying the user replacements and the
   * mapper's own substitutions.
   *
   * @param {IShaderSources} shaders The shader sources, edited in place.
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkVolume} actor The volume being rendered.
   */
  buildShaders(
    shaders: IShaderSources,
    ren: vtkRenderer,
    actor: vtkVolume
  ): void;

  /**
   * Set the clipping plane uniforms of the shader program.
   *
   * @param cellBO The OpenGL helper carrying the shader program.
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkVolume} actor The volume being rendered.
   */
  getClippingPlaneShaderParameters(
    cellBO: any,
    ren: vtkRenderer,
    actor: vtkVolume
  ): void;

  /**
   * Get the WebGL context this mapper renders with.
   */
  getContext(): Nullable<WebGL2RenderingContext>;

  /**
   * Get the sample distance to ray cast with, which is the renderable's sample
   * distance scaled by its interaction factor while the interactor animates.
   *
   * @param {vtkRenderer} ren The renderer.
   */
  getCurrentSampleDistance(ren: vtkRenderer): number;

  /**
   * Whether the textures and the vertex buffer are out of date.
   *
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkVolume} actor The volume being rendered.
   */
  getNeedToRebuildBufferObjects(ren: vtkRenderer, actor: vtkVolume): boolean;

  /**
   * Whether the shader program has to be rebuilt for the given helper.
   *
   * @param cellBO The OpenGL helper carrying the shader program.
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkVolume} actor The volume being rendered.
   */
  getNeedToRebuildShaders(
    cellBO: any,
    ren: vtkRenderer,
    actor: vtkVolume
  ): boolean;

  /**
   * Get the lower left corner of the viewport this mapper renders into.
   */
  getRenderTargetOffset(): Vector2;

  /**
   * Get the width and height of the target this mapper renders into, which is
   * the reduced offscreen size while the volume is rendered at a lower
   * resolution.
   */
  getRenderTargetSize(): Vector2;

  /**
   * Fill in the shader template, letting the renderable's OpenGL view specific
   * properties override any of the three shader sources.
   *
   * @param {IShaderSources} shaders The shader sources, edited in place.
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkVolume} actor The volume being rendered.
   */
  getReplacedShaderTemplate(
    shaders: IShaderSources,
    ren: vtkRenderer,
    actor: vtkVolume
  ): void;

  /**
   * Fill in the shader sources with the default volume shader template.
   *
   * @param {IShaderSources} shaders The shader sources, edited in place.
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkVolume} actor The volume being rendered.
   */
  getShaderTemplate(
    shaders: IShaderSources,
    ren: vtkRenderer,
    actor: vtkVolume
  ): void;

  /**
   * Capture the z-buffer texture of the pass, so that the volume can be mixed
   * with the opaque geometry.
   *
   * @param {Boolean} prepass Whether the traversal is on its way down.
   * @param {vtkForwardPass} renderPass The pass holding the z-buffer texture.
   */
  opaqueZBufferPass(prepass: boolean, renderPass: vtkForwardPass): void;

  /**
   * Render the volume for the given renderer and actor.
   *
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkVolume} actor The volume being rendered.
   */
  renderPiece(ren: vtkRenderer, actor: vtkVolume): void;

  /**
   * Activate the textures, update the shaders and draw the box the volume is
   * ray cast through.
   *
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkVolume} actor The volume being rendered.
   */
  renderPieceDraw(ren: vtkRenderer, actor: vtkVolume): void;

  /**
   * Blit the reduced-resolution offscreen result back onto the render target
   * and update the frame timing that drives the resolution.
   *
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkVolume} actor The volume being rendered.
   */
  renderPieceFinish(ren: vtkRenderer, actor: vtkVolume): void;

  /**
   * Pick the render resolution from the recent frame times, bind the offscreen
   * framebuffer when one is needed, and bring the buffer objects up to date.
   *
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkVolume} actor The volume being rendered.
   */
  renderPieceStart(ren: vtkRenderer, actor: vtkVolume): void;

  /**
   * Substitute the mapper's own declarations and implementation into the
   * shader sources.
   *
   * @param {IShaderSources} shaders The shader sources, edited in place.
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkVolume} actor The volume being rendered.
   */
  replaceShaderValues(
    shaders: IShaderSources,
    ren: vtkRenderer,
    actor: vtkVolume
  ): void;

  /**
   * Set the camera uniforms of the shader program.
   *
   * @param cellBO The OpenGL helper carrying the shader program.
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkVolume} actor The volume being rendered.
   */
  setCameraShaderParameters(
    cellBO: any,
    ren: vtkRenderer,
    actor: vtkVolume
  ): void;

  /**
   * Set the WebGL context this mapper renders with.
   *
   * @param context The WebGL context.
   */
  setContext(context: Nullable<WebGL2RenderingContext>): boolean;

  /**
   * Set the texture and geometry uniforms of the shader program.
   *
   * @param cellBO The OpenGL helper carrying the shader program.
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkVolume} actor The volume being rendered.
   */
  setMapperShaderParameters(
    cellBO: any,
    ren: vtkRenderer,
    actor: vtkVolume
  ): void;

  /**
   * Set the volume property uniforms of the shader program, including the
   * transfer function ranges and the lighting.
   *
   * @param cellBO The OpenGL helper carrying the shader program.
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkVolume} actor The volume being rendered.
   */
  setPropertyShaderParameters(
    cellBO: any,
    ren: vtkRenderer,
    actor: vtkVolume
  ): void;

  /**
   * Rebuild the buffer objects when they are out of date.
   *
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkVolume} actor The volume being rendered.
   */
  updateBufferObjects(ren: vtkRenderer, actor: vtkVolume): void;

  /**
   * Make the helper's shader program current, rebuilding it when needed, and
   * push the mapper, camera and property uniforms.
   *
   * @param cellBO The OpenGL helper carrying the shader program.
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkVolume} actor The volume being rendered.
   */
  updateShaders(cellBO: any, ren: vtkRenderer, actor: vtkVolume): void;

  /**
   * Resolve the ancestors this mapper renders with and render the volume.
   *
   * @param {Boolean} prepass Whether the traversal is on its way down.
   * @param {vtkRenderPass} renderPass The render pass being traversed.
   */
  volumePass(prepass: boolean, renderPass: vtkRenderPass): void;

  /**
   * Capture the z-buffer texture of the pass, so that the volume can be mixed
   * with the opaque geometry.
   *
   * @param {Boolean} prepass Whether the traversal is on its way down.
   * @param {vtkForwardPass} renderPass The pass holding the z-buffer texture.
   */
  zBufferPass(prepass: boolean, renderPass: vtkForwardPass): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkOpenGLVolumeMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IOpenGLVolumeMapperInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IOpenGLVolumeMapperInitialValues
): void;

/**
 * Method used to create a new instance of vtkOpenGLVolumeMapper.
 * @param {IOpenGLVolumeMapperInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IOpenGLVolumeMapperInitialValues
): vtkOpenGLVolumeMapper;

/**
 * vtkOpenGLVolumeMapper is the WebGL scene graph node that ray casts a
 * vtkVolume whose mapper is a vtkVolumeMapper. It renders into an offscreen
 * framebuffer whose resolution follows the recent frame times, so that
 * interaction stays responsive, and blits the result back.
 *
 * Importing this module registers it as the OpenGL override for
 * `vtkVolumeMapper`.
 */
declare const vtkOpenGLVolumeMapper: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkOpenGLVolumeMapper;
