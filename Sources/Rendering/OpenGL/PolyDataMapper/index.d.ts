import { Nullable } from '../../../types';
import vtkActor from '../../Core/Actor';
import vtkRenderer from '../../Core/Renderer';
import vtkRenderPass from '../../SceneGraph/RenderPass';
import { IViewNodeInitialValues, vtkViewNode } from '../../SceneGraph/ViewNode';
import { ICoincidentTopology } from '../../Core/Mapper/CoincidentTopologyHelper';

/**
 * The GLSL sources a mapper assembles before compiling them into a program.
 */
export interface IShaderSources {
  Vertex: string;
  Fragment: string;
  Geometry: string;
}

/**
 * Initial values for creating a new instance of vtkOpenGLPolyDataMapper.
 */
export interface IOpenGLPolyDataMapperInitialValues extends IViewNodeInitialValues {
  context?: Nullable<WebGL2RenderingContext>;
  VBOBuildTime?: number;
  VBOBuildString?: Nullable<string>;
  primitives?: Nullable<any[]>;
  primTypes?: any;
  shaderRebuildString?: Nullable<string>;
  tmpMat4?: Nullable<Float64Array>;
  lastHaveSeenDepthRequest?: boolean;
  haveSeenDepthRequest?: boolean;
  lastSelectionState?: number;
  selectionWebGLIdsToVTKIds?: any;
  pointPicking?: boolean;
  lastForceFlatten?: boolean;
}

export interface vtkOpenGLPolyDataMapper extends vtkViewNode {
  /**
   * Locate the scene graph nodes this mapper renders through.
   * @param prepass
   */
  buildPass(prepass: boolean): void;

  /**
   * @param prepass
   * @param {vtkRenderPass} renderPass
   */
  translucentPass(prepass: boolean, renderPass: vtkRenderPass): void;

  /**
   * @param prepass
   */
  zBufferPass(prepass: boolean): void;

  /**
   * @param prepass
   */
  opaqueZBufferPass(prepass: boolean): void;

  /**
   * @param prepass
   */
  opaquePass(prepass: boolean): void;

  /**
   * Renders the piece held by this mapper.
   */
  render(): void;

  /**
   * Fill the shader sources with the templates this mapper starts from.
   * @param shaders
   * @param {vtkRenderer} ren
   * @param {vtkActor} actor
   */
  getShaderTemplate(
    shaders: IShaderSources,
    ren: vtkRenderer,
    actor: vtkActor
  ): void;

  /**
   * Apply the user supplied shader replacements found on the renderable's
   * OpenGL view specific properties.
   * @param shaders
   * @param viewSpec the OpenGL view specific properties, may be undefined
   * @param pre when true only the replacements flagged `replaceFirst` are applied
   */
  applyShaderReplacements(
    shaders: IShaderSources,
    viewSpec: any,
    pre?: boolean
  ): void;

  /**
   * Assemble the full shader sources for the given renderer and actor.
   * @param shaders
   * @param {vtkRenderer} ren
   * @param {vtkActor} actor
   */
  buildShaders(
    shaders: IShaderSources,
    ren: vtkRenderer,
    actor: vtkActor
  ): void;

  /**
   * Fetch the shader templates and apply the per shader code overrides found on
   * the renderable's OpenGL view specific properties.
   * @param shaders
   * @param {vtkRenderer} ren
   * @param {vtkActor} actor
   */
  getReplacedShaderTemplate(
    shaders: IShaderSources,
    ren: vtkRenderer,
    actor: vtkActor
  ): void;

  /**
   * @param shaders
   * @param {vtkRenderer} ren
   * @param {vtkActor} actor
   */
  replaceShaderColor(
    shaders: IShaderSources,
    ren: vtkRenderer,
    actor: vtkActor
  ): void;

  /**
   * @param shaders
   * @param {vtkRenderer} ren
   * @param {vtkActor} actor
   */
  replaceShaderLight(
    shaders: IShaderSources,
    ren: vtkRenderer,
    actor: vtkActor
  ): void;

  /**
   * @param shaders
   * @param {vtkRenderer} ren
   * @param {vtkActor} actor
   */
  replaceShaderNormal(
    shaders: IShaderSources,
    ren: vtkRenderer,
    actor: vtkActor
  ): void;

  /**
   * @param shaders
   * @param {vtkRenderer} ren
   * @param {vtkActor} actor
   */
  replaceShaderPositionVC(
    shaders: IShaderSources,
    ren: vtkRenderer,
    actor: vtkActor
  ): void;

  /**
   * @param shaders
   * @param {vtkRenderer} ren
   * @param {vtkActor} actor
   */
  replaceShaderTCoord(
    shaders: IShaderSources,
    ren: vtkRenderer,
    actor: vtkActor
  ): void;

  /**
   * @param shaders
   * @param {vtkRenderer} ren
   * @param {vtkActor} actor
   */
  replaceShaderClip(
    shaders: IShaderSources,
    ren: vtkRenderer,
    actor: vtkActor
  ): void;

  /**
   * @param shaders
   * @param {vtkRenderer} ren
   * @param {vtkActor} actor
   */
  replaceShaderPicking(
    shaders: IShaderSources,
    ren: vtkRenderer,
    actor: vtkActor
  ): void;

  /**
   * Add the polygon offset uniforms when the coincident parameters are non zero.
   * @param shaders
   * @param {vtkRenderer} ren
   * @param {vtkActor} actor
   */
  replaceShaderCoincidentOffset(
    shaders: IShaderSources,
    ren: vtkRenderer,
    actor: vtkActor
  ): void;

  /**
   * Run every shader replacement this mapper implements.
   * @param shaders
   * @param {vtkRenderer} ren
   * @param {vtkActor} actor
   */
  replaceShaderValues(
    shaders: IShaderSources,
    ren: vtkRenderer,
    actor: vtkActor
  ): void;

  /**
   * The polygon offset factor and offset to use for the primitive currently
   * being rendered.
   * @param {vtkRenderer} ren
   * @param {vtkActor} actor
   */
  getCoincidentParameters(
    ren: vtkRenderer,
    actor: vtkActor
  ): ICoincidentTopology;

  /**
   * @param cellBO the helper holding the program for a primitive type
   * @param {vtkRenderer} ren
   * @param {vtkActor} actor
   */
  getNeedToRebuildShaders(
    cellBO: any,
    ren: vtkRenderer,
    actor: vtkActor
  ): boolean;

  /**
   * Invoke the user supplied shader callbacks registered on the renderable.
   * @param cellBO
   * @param {vtkRenderer} ren
   * @param {vtkActor} actor
   */
  invokeShaderCallbacks(cellBO: any, ren: vtkRenderer, actor: vtkActor): void;

  /**
   * @param cellBO
   * @param {vtkRenderer} ren
   * @param {vtkActor} actor
   */
  setMapperShaderParameters(
    cellBO: any,
    ren: vtkRenderer,
    actor: vtkActor
  ): void;

  /**
   * @param cellBO
   * @param {vtkRenderer} ren
   * @param {vtkActor} actor
   */
  setLightingShaderParameters(
    cellBO: any,
    ren: vtkRenderer,
    actor: vtkActor
  ): void;

  /**
   * @param cellBO
   * @param {vtkRenderer} ren
   * @param {vtkActor} actor
   */
  setCameraShaderParameters(
    cellBO: any,
    ren: vtkRenderer,
    actor: vtkActor
  ): void;

  /**
   * @param cellBO
   * @param {vtkRenderer} ren
   * @param {vtkActor} actor
   */
  setPropertyShaderParameters(
    cellBO: any,
    ren: vtkRenderer,
    actor: vtkActor
  ): void;

  /**
   * Tell the hardware selector the largest point and cell ids this mapper can
   * emit.
   * @param {vtkRenderer} ren
   * @param {vtkActor} actor
   */
  updateMaximumPointCellIds(ren: vtkRenderer, actor: vtkActor): void;

  /**
   * @param {vtkRenderer} ren
   * @param {vtkActor} actor
   */
  renderPieceStart(ren: vtkRenderer, actor: vtkActor): void;

  /**
   * @param {vtkRenderer} ren
   * @param {vtkActor} actor
   */
  renderPieceDraw(ren: vtkRenderer, actor: vtkActor): void;

  /**
   * @param {vtkRenderer} ren
   * @param {vtkActor} actor
   */
  renderPieceFinish(ren: vtkRenderer, actor: vtkActor): void;

  /**
   * @param {vtkRenderer} ren
   * @param {vtkActor} actor
   */
  renderPiece(ren: vtkRenderer, actor: vtkActor): void;

  /**
   * Rebuild the buffer objects when they are out of date.
   * @param {vtkRenderer} ren
   * @param {vtkActor} actor
   */
  updateBufferObjects(ren: vtkRenderer, actor: vtkActor): void;

  /**
   * @param {vtkRenderer} ren
   * @param {vtkActor} actor
   */
  getNeedToRebuildBufferObjects(ren: vtkRenderer, actor: vtkActor): boolean;

  /**
   * @param {vtkRenderer} ren
   * @param {vtkActor} actor
   */
  buildBufferObjects(ren: vtkRenderer, actor: vtkActor): void;

  /**
   * The GPU memory the primitives of this mapper currently hold, in bytes.
   */
  getAllocatedGPUMemoryInBytes(): number;

  /**
   * The WebGL context this mapper renders into.
   */
  getContext(): Nullable<WebGL2RenderingContext>;

  /**
   * @param context
   */
  setContext(context: Nullable<WebGL2RenderingContext>): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkOpenGLPolyDataMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IOpenGLPolyDataMapperInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IOpenGLPolyDataMapperInitialValues
): void;

/**
 * Method used to create a new instance of vtkOpenGLPolyDataMapper.
 * @param {IOpenGLPolyDataMapperInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IOpenGLPolyDataMapperInitialValues
): vtkOpenGLPolyDataMapper;

/**
 * The OpenGL backend view node for vtkMapper.
 */
export declare const vtkOpenGLPolyDataMapper: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkOpenGLPolyDataMapper;
