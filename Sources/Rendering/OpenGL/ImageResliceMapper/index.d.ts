import { Nullable } from '../../../types';
import { ICoincidentTopology } from '../../Core/Mapper/CoincidentTopologyHelper';
import { vtkImageProperty } from '../../Core/ImageProperty';
import { vtkImageSlice } from '../../Core/ImageSlice';
import { vtkRenderer } from '../../Core/Renderer';
import vtkOpenGLTexture from '../Texture';
import vtkPolyData from '../../../Common/DataModel/PolyData';
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
 * One label map input, paired with the position it holds among the valid
 * inputs of the mapper.
 */
export interface ILabelOutlineProperty {
  property: vtkImageProperty;
  arrayIndex: number;
}

/**
 *
 */
export interface IOpenGLImageResliceMapperInitialValues extends IViewNodeInitialValues {
  VBOBuildString?: Nullable<string>;
  haveSeenDepthRequest?: boolean;
  lastHaveSeenDepthRequest?: boolean;
  lastIndependentComponents?: boolean;
  lastUseLabelOutline?: boolean;
  lastNumValidInputs?: number;
  lastNumberOfComponents?: number;
  lastMultiTexturePerVolumeEnabled?: boolean;
  lastSlabThickness?: number;
  lastSlabTrapezoidIntegration?: number;
  lastSlabType?: number;
  scalarTextures?: vtkOpenGLTexture[];
  colorTexture?: Nullable<vtkOpenGLTexture>;
  pwfTexture?: Nullable<vtkOpenGLTexture>;
  labelOutlineProperties?: ILabelOutlineProperty[];
  labelOutlineThicknessTexture?: Nullable<vtkOpenGLTexture>;
  labelOutlineOpacityTexture?: Nullable<vtkOpenGLTexture>;
  resliceGeom?: Nullable<vtkPolyData>;
  resliceGeomUpdateString?: Nullable<string>;
  tris?: any;
}

export interface vtkOpenGLImageResliceMapper extends vtkViewNode {
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
   * vertex buffer of the reslice geometry.
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
   * Get the textures holding the scalars of the valid inputs, one per
   * component.
   */
  getScalarTextures(): vtkOpenGLTexture[];

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
   * Render the slice.
   */
  render(): void;

  /**
   * Render the slice for the given renderer and actor.
   *
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkImageSlice} actor The image slice being rendered.
   */
  renderPiece(ren: vtkRenderer, actor: vtkImageSlice): void;

  /**
   * Activate the textures, update the shaders and draw the reslice geometry.
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
   * Bring the buffer objects up to date and set the texture filters from the
   * interpolation type of each input property.
   *
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkImageSlice} actor The image slice being rendered.
   */
  renderPieceStart(ren: vtkRenderer, actor: vtkImageSlice): void;

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
   * Substitute the view coordinate position declarations and implementation
   * into the shader sources.
   *
   * @param {IShaderSources} shaders The shader sources, edited in place.
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkImageSlice} actor The image slice being rendered.
   */
  replaceShaderPositionVC(
    shaders: IShaderSources,
    ren: vtkRenderer,
    actor: vtkImageSlice
  ): void;

  /**
   * Substitute the texture sampling declarations and implementation, including
   * slab compositing and label outlines, into the shader sources.
   *
   * @param {IShaderSources} shaders The shader sources, edited in place.
   * @param {vtkRenderer} ren The renderer.
   * @param {vtkImageSlice} actor The image slice being rendered.
   */
  replaceShaderTCoord(
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
   * Supply the scalar textures from outside the mapper. The mapper then keeps
   * them as they are instead of rebuilding them from its inputs.
   *
   * @param {vtkOpenGLTexture[]} scalarTextures The scalar textures to use.
   */
  setScalarTextures(scalarTextures: vtkOpenGLTexture[]): void;

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
   * Build or reuse the texture holding one row of per-label outline opacities
   * per label map input.
   *
   * @param {ILabelOutlineProperty[]} labelOutlineProperties The label map inputs.
   */
  updateLabelOutlineOpacityTexture(
    labelOutlineProperties: ILabelOutlineProperty[]
  ): void;

  /**
   * Build or reuse the texture holding one row of per-label outline
   * thicknesses per label map input.
   *
   * @param {ILabelOutlineProperty[]} labelOutlineProperties The label map inputs.
   */
  updateLabelOutlineThicknessTexture(
    labelOutlineProperties: ILabelOutlineProperty[]
  ): void;

  /**
   * Rebuild the polydata the slice is drawn on, either from the renderable's
   * slice polydata or by cutting the image bounding box with its slice plane.
   */
  updateResliceGeometry(): void;

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
 * Method used to decorate a given object (publicAPI+model) with vtkOpenGLImageResliceMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IOpenGLImageResliceMapperInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IOpenGLImageResliceMapperInitialValues
): void;

/**
 * Method used to create a new instance of vtkOpenGLImageResliceMapper.
 * @param {IOpenGLImageResliceMapperInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IOpenGLImageResliceMapperInitialValues
): vtkOpenGLImageResliceMapper;

/**
 * vtkOpenGLImageResliceMapper is the WebGL scene graph node that draws a
 * vtkImageSlice whose mapper is a vtkImageResliceMapper. It samples the volume
 * along an arbitrary slice plane, optionally integrating a slab, and assembles
 * the shader program that colors the result.
 *
 * Importing this module registers it as the OpenGL override for
 * `vtkImageResliceMapper`.
 */
declare const vtkOpenGLImageResliceMapper: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkOpenGLImageResliceMapper;
