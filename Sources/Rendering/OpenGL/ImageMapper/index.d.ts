import { Nullable, Vector2 } from '../../../types';
import { ICoincidentTopology } from '../../Core/Mapper/CoincidentTopologyHelper';
import { vtkImageSlice } from '../../Core/ImageSlice';
import { vtkRenderer } from '../../Core/Renderer';
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
export interface IOpenGLImageMapperInitialValues extends IViewNodeInitialValues {
  VBOBuildString?: Nullable<string>;
  openGLTexture?: Nullable<vtkOpenGLTexture>;
  tris?: any;
  imagemat?: Nullable<Float64Array>;
  imagematinv?: Nullable<Float64Array>;
  colorTexture?: Nullable<vtkOpenGLTexture>;
  pwfTexture?: Nullable<vtkOpenGLTexture>;
  labelOutlineThicknessTexture?: Nullable<vtkOpenGLTexture>;
  labelOutlineOpacityTexture?: Nullable<vtkOpenGLTexture>;
  lastHaveSeenDepthRequest?: boolean;
  haveSeenDepthRequest?: boolean;
  lastTextureComponents?: number;
}

export interface vtkOpenGLImageMapper extends vtkViewNode {
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
   * Build the texture and the vertex buffer of the quad the slice is drawn on.
   *
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkImageSlice} actor The image slice being rendered.
   */
  buildBufferObjects(ren: vtkRenderer, actor: vtkImageSlice): void;

  /**
   * Resolve the ancestors this mapper renders with: its image slice, its
   * renderer, its render window and the camera view node.
   *
   * @param {Boolean} prepass Whether the traversal is on its way down.
   */
  buildPass(prepass: boolean): void;

  /**
   * Assemble the shader sources, applying the render pass replacement, the
   * user replacements and the mapper's own substitutions.
   *
   * @param {IShaderSources} shaders The shader sources, edited in place.
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkImageSlice} actor The image slice being rendered.
   */
  buildShaders(
    shaders: IShaderSources,
    ren: vtkRenderer,
    actor: vtkImageSlice
  ): void;

  /**
   * Get the polygon offset the renderable asks for, or `null` when it does not
   * resolve coincident topology with a polygon offset.
   *
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkImageSlice} actor The image slice being rendered.
   */
  getCoincidentParameters(
    ren: vtkRenderer,
    actor: vtkImageSlice
  ): Nullable<ICoincidentTopology>;

  /**
   * Whether the textures and the vertex buffer are out of date.
   *
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkImageSlice} actor The image slice being rendered.
   */
  getNeedToRebuildBufferObjects(
    ren: vtkRenderer,
    actor: vtkImageSlice
  ): boolean;

  /**
   * Whether the shader program has to be rebuilt for the given helper.
   *
   * @param cellBO The OpenGL helper carrying the shader program.
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkImageSlice} actor The image slice being rendered.
   */
  getNeedToRebuildShaders(
    cellBO: any,
    ren: vtkRenderer,
    actor: vtkImageSlice
  ): boolean;

  /**
   * Get the lower left corner of the viewport this mapper renders into.
   */
  getRenderTargetOffset(): Vector2;

  /**
   * Get the width and height of the viewport this mapper renders into.
   */
  getRenderTargetSize(): Vector2;

  /**
   * Fill in the shader template, letting the renderable's OpenGL view specific
   * properties override any of the three shader sources.
   *
   * @param {IShaderSources} shaders The shader sources, edited in place.
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkImageSlice} actor The image slice being rendered.
   */
  getReplacedShaderTemplate(
    shaders: IShaderSources,
    ren: vtkRenderer,
    actor: vtkImageSlice
  ): void;

  /**
   * Fill in the shader sources with the default polydata shader template.
   *
   * @param {IShaderSources} shaders The shader sources, edited in place.
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkImageSlice} actor The image slice being rendered.
   */
  getShaderTemplate(
    shaders: IShaderSources,
    ren: vtkRenderer,
    actor: vtkImageSlice
  ): void;

  /**
   * Render the slice during the opaque pass.
   *
   * @param {Boolean} prepass Whether the traversal is on its way down.
   */
  opaquePass(prepass: boolean): void;

  /**
   * Capture the slice depth during the opaque z-buffer pass.
   *
   * @param {Boolean} prepass Whether the traversal is on its way down.
   */
  opaqueZBufferPass(prepass: boolean): void;

  /**
   * Render the slice for the given renderer and actor.
   *
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkImageSlice} actor The image slice being rendered.
   */
  renderPiece(ren: vtkRenderer, actor: vtkImageSlice): void;

  /**
   * Update the shaders and draw the quad the slice is textured onto.
   *
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkImageSlice} actor The image slice being rendered.
   */
  renderPieceDraw(ren: vtkRenderer, actor: vtkImageSlice): void;

  /**
   * Hook run after the slice has been drawn. It does nothing.
   *
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkImageSlice} actor The image slice being rendered.
   */
  renderPieceFinish(ren: vtkRenderer, actor: vtkImageSlice): void;

  /**
   * Bring the buffer objects and the texture filters up to date before the
   * slice is drawn.
   *
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkImageSlice} actor The image slice being rendered.
   */
  renderPieceStart(ren: vtkRenderer, actor: vtkImageSlice): void;

  /**
   * Substitute the clipping plane declarations and implementation into the
   * shader sources.
   *
   * @param {IShaderSources} shaders The shader sources, edited in place.
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkImageSlice} actor The image slice being rendered.
   */
  replaceShaderClip(
    shaders: IShaderSources,
    ren: vtkRenderer,
    actor: vtkImageSlice
  ): void;

  /**
   * Substitute the depth offset the renderable's coincident topology
   * resolution asks for into the fragment shader.
   *
   * @param {IShaderSources} shaders The shader sources, edited in place.
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkImageSlice} actor The image slice being rendered.
   */
  replaceShaderCoincidentOffset(
    shaders: IShaderSources,
    ren: vtkRenderer,
    actor: vtkImageSlice
  ): void;

  /**
   * Substitute the mapper's own declarations and implementation into the
   * shader sources.
   *
   * @param {IShaderSources} shaders The shader sources, edited in place.
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkImageSlice} actor The image slice being rendered.
   */
  replaceShaderValues(
    shaders: IShaderSources,
    ren: vtkRenderer,
    actor: vtkImageSlice
  ): void;

  /**
   * Render the slice.
   */
  render(): void;

  /**
   * Set the camera uniforms of the shader program.
   *
   * @param cellBO The OpenGL helper carrying the shader program.
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkImageSlice} actor The image slice being rendered.
   */
  setCameraShaderParameters(
    cellBO: any,
    ren: vtkRenderer,
    actor: vtkImageSlice
  ): void;

  /**
   * Set the texture and geometry uniforms of the shader program.
   *
   * @param cellBO The OpenGL helper carrying the shader program.
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkImageSlice} actor The image slice being rendered.
   */
  setMapperShaderParameters(
    cellBO: any,
    ren: vtkRenderer,
    actor: vtkImageSlice
  ): void;

  /**
   * Set the image property uniforms of the shader program.
   *
   * @param cellBO The OpenGL helper carrying the shader program.
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkImageSlice} actor The image slice being rendered.
   */
  setPropertyShaderParameters(
    cellBO: any,
    ren: vtkRenderer,
    actor: vtkImageSlice
  ): void;

  /**
   * Render the slice during the translucent pass, remembering the render pass
   * so that its shader replacement is applied.
   *
   * @param {Boolean} prepass Whether the traversal is on its way down.
   * @param {vtkRenderPass} renderPass The render pass being traversed.
   */
  translucentPass(prepass: boolean, renderPass: vtkRenderPass): void;

  /**
   * Rebuild the buffer objects when they are out of date.
   *
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkImageSlice} actor The image slice being rendered.
   */
  updateBufferObjects(ren: vtkRenderer, actor: vtkImageSlice): void;

  /**
   * Build or reuse the texture holding the per-label outline opacities of the
   * given image slice.
   *
   * @param {vtkImageSlice} image The image slice being rendered.
   */
  updateLabelOutlineOpacityTexture(image: vtkImageSlice): void;

  /**
   * Build or reuse the texture holding the per-label outline thicknesses of
   * the given image slice.
   *
   * @param {vtkImageSlice} image The image slice being rendered.
   */
  updatelabelOutlineThicknessTexture(image: vtkImageSlice): void;

  /**
   * Make the helper's shader program current, rebuilding it when needed, and
   * push the mapper, camera and property uniforms.
   *
   * @param cellBO The OpenGL helper carrying the shader program.
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkImageSlice} actor The image slice being rendered.
   */
  updateShaders(cellBO: any, ren: vtkRenderer, actor: vtkImageSlice): void;

  /**
   * Render the slice depth only, so that a later pass can mix geometry with
   * volumes.
   *
   * @param {Boolean} prepass Whether the traversal is on its way down.
   */
  zBufferPass(prepass: boolean): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkOpenGLImageMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IOpenGLImageMapperInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IOpenGLImageMapperInitialValues
): void;

/**
 * Method used to create a new instance of vtkOpenGLImageMapper.
 * @param {IOpenGLImageMapperInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IOpenGLImageMapperInitialValues
): vtkOpenGLImageMapper;

/**
 * vtkOpenGLImageMapper is the WebGL scene graph node that draws a vtkImageSlice
 * whose mapper is a vtkImageMapper. It textures the slice onto a quad and
 * assembles the shader program that applies the color transfer function, the
 * piecewise opacity function and, for label maps, the label outline.
 *
 * Importing this module registers it as the OpenGL override for
 * `vtkAbstractImageMapper`.
 */
declare const vtkOpenGLImageMapper: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkOpenGLImageMapper;
