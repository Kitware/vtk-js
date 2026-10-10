import { vtkAlgorithm } from '../../../interfaces';
import { Nullable } from '../../../types';
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
export interface IOpenGLImageCPRMapperInitialValues extends IViewNodeInitialValues {
  currentRenderPass?: Nullable<vtkRenderPass>;
  volumeTexture?: Nullable<vtkOpenGLTexture>;
  colorTexture?: Nullable<vtkOpenGLTexture>;
  pwfTexture?: Nullable<vtkOpenGLTexture>;
  tris?: any;
  lastHaveSeenDepthRequest?: boolean;
  haveSeenDepthRequest?: boolean;
  lastTextureComponents?: number;
  lastIndependentComponents?: number;
  imagemat?: Nullable<Float64Array>;
  imagematinv?: Nullable<Float64Array>;
}

/**
 * The mapper has two input ports and no output port, so the pipeline half of
 * `vtkAlgorithm` that reads an output is not installed.
 */
type vtkOpenGLImageCPRMapperBase = vtkViewNode &
  Omit<vtkAlgorithm, 'getOutputData' | 'getOutputPort'>;

export interface vtkOpenGLImageCPRMapper extends vtkOpenGLImageCPRMapperBase {
  /**
   * Build the volume, color and opacity textures, and the vertex buffer of the
   * quads the straightened image is drawn on.
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
   * Fill in the shader template and run the mapper's own substitutions.
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
   * Render the straightened image during the opaque pass, remembering the
   * render pass so that its shader replacement is applied.
   *
   * @param {Boolean} prepass Whether the traversal is on its way down.
   * @param {vtkRenderPass} renderPass The render pass being traversed.
   */
  opaquePass(prepass: boolean, renderPass: vtkRenderPass): void;

  /**
   * Capture the depth of the straightened image during the opaque z-buffer
   * pass.
   *
   * @param {Boolean} prepass Whether the traversal is on its way down.
   */
  opaqueZBufferPass(prepass: boolean): void;

  /**
   * Render the straightened image.
   */
  render(): void;

  /**
   * Update the renderable, then render the straightened image for the given
   * renderer and prop. Does nothing when the renderable's pre-render check
   * fails.
   *
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkImageSlice} prop The image slice being rendered.
   */
  renderPiece(ren: vtkRenderer, prop: vtkImageSlice): void;

  /**
   * Activate the textures, update the shaders and draw the quads.
   *
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkImageSlice} actor The image slice being rendered.
   */
  renderPieceDraw(ren: vtkRenderer, actor: vtkImageSlice): void;

  /**
   * Hook run after the straightened image has been drawn. It does nothing.
   *
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkImageSlice} actor The image slice being rendered.
   */
  renderPieceFinish(ren: vtkRenderer, actor: vtkImageSlice): void;

  /**
   * Bring the buffer objects up to date before the quads are drawn.
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
   * Rebuild the buffer objects when they are out of date, then set the texture
   * filters from the interpolation type of the actor property.
   *
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkImageSlice} actor The image slice being rendered.
   */
  updateBufferObjects(ren: vtkRenderer, actor: vtkImageSlice): void;

  /**
   * Make the helper's shader program current, rebuilding it when needed, and
   * push the mapper, camera and property uniforms.
   *
   * @param cellBO The OpenGL helper carrying the shader program.
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkImageSlice} actor The image slice being rendered.
   */
  updateShaders(cellBO: any, ren: vtkRenderer, actor: vtkImageSlice): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkOpenGLImageCPRMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IOpenGLImageCPRMapperInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IOpenGLImageCPRMapperInitialValues
): void;

/**
 * Method used to create a new instance of vtkOpenGLImageCPRMapper.
 * @param {IOpenGLImageCPRMapperInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IOpenGLImageCPRMapperInitialValues
): vtkOpenGLImageCPRMapper;

/**
 * vtkOpenGLImageCPRMapper is the WebGL scene graph node that draws a
 * vtkImageSlice whose mapper is a vtkImageCPRMapper. It samples the volume
 * along the centerline the renderable carries and draws the straightened
 * result as a strip of quads.
 *
 * Importing this module registers it as the OpenGL override for
 * `vtkImageCPRMapper`.
 */
declare const vtkOpenGLImageCPRMapper: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export declare const STATIC: Readonly<Record<never, never>>;
export default vtkOpenGLImageCPRMapper;
