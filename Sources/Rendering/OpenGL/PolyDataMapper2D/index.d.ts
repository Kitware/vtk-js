import { Nullable } from '../../../types';
import vtkActor2D from '../../Core/Actor2D';
import vtkRenderer from '../../Core/Renderer';
import { IViewNodeInitialValues, vtkViewNode } from '../../SceneGraph/ViewNode';
import { IShaderSources } from '../PolyDataMapper';

/**
 * Initial values for creating a new instance of vtkOpenGLPolyDataMapper2D.
 */
export interface IOpenGLPolyDataMapper2DInitialValues extends IViewNodeInitialValues {
  context?: Nullable<WebGL2RenderingContext>;
  VBOBuildTime?: number;
  VBOBuildString?: Nullable<string>;
  primitives?: Nullable<any[]>;
  primTypes?: any;
  shaderRebuildString?: Nullable<string>;
}

export interface vtkOpenGLPolyDataMapper2D extends vtkViewNode {
  /**
   * Locate the scene graph nodes this mapper renders through.
   * @param prepass
   */
  buildPass(prepass: boolean): void;

  /**
   * @param prepass
   */
  overlayPass(prepass: boolean): void;

  /**
   * Renders the piece held by this mapper.
   */
  render(): void;

  /**
   * Fill the shader sources with the templates this mapper starts from.
   * @param shaders
   * @param {vtkRenderer} ren
   * @param {vtkActor2D} actor
   */
  getShaderTemplate(
    shaders: IShaderSources,
    ren: vtkRenderer,
    actor: vtkActor2D
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
   * @param {vtkActor2D} actor
   */
  buildShaders(
    shaders: IShaderSources,
    ren: vtkRenderer,
    actor: vtkActor2D
  ): void;

  /**
   * Fetch the shader templates and apply the per shader code overrides found on
   * the renderable's OpenGL view specific properties.
   * @param shaders
   * @param {vtkRenderer} ren
   * @param {vtkActor2D} actor
   */
  getReplacedShaderTemplate(
    shaders: IShaderSources,
    ren: vtkRenderer,
    actor: vtkActor2D
  ): void;

  /**
   * @param shaders
   * @param {vtkRenderer} ren
   * @param {vtkActor2D} actor
   */
  replaceShaderColor(
    shaders: IShaderSources,
    ren: vtkRenderer,
    actor: vtkActor2D
  ): void;

  /**
   * @param shaders
   * @param {vtkRenderer} ren
   * @param {vtkActor2D} actor
   */
  replaceShaderTCoord(
    shaders: IShaderSources,
    ren: vtkRenderer,
    actor: vtkActor2D
  ): void;

  /**
   * @param shaders
   * @param {vtkRenderer} ren
   * @param {vtkActor2D} actor
   */
  replaceShaderPicking(
    shaders: IShaderSources,
    ren: vtkRenderer,
    actor: vtkActor2D
  ): void;

  /**
   * @param shaders
   * @param {vtkRenderer} ren
   * @param {vtkActor2D} actor
   */
  replaceShaderPositionVC(
    shaders: IShaderSources,
    ren: vtkRenderer,
    actor: vtkActor2D
  ): void;

  /**
   * Add the polygon offset uniforms when the coincident parameters are non zero.
   * @param shaders
   * @param {vtkRenderer} ren
   * @param {vtkActor2D} actor
   */
  replaceShaderCoincidentOffset(
    shaders: IShaderSources,
    ren: vtkRenderer,
    actor: vtkActor2D
  ): void;

  /**
   * Run every shader replacement this mapper implements.
   * @param shaders
   * @param {vtkRenderer} ren
   * @param {vtkActor2D} actor
   */
  replaceShaderValues(
    shaders: IShaderSources,
    ren: vtkRenderer,
    actor: vtkActor2D
  ): void;

  /**
   * @param cellBO the helper holding the program for a primitive type
   * @param {vtkRenderer} ren
   * @param {vtkActor2D} actor
   */
  getNeedToRebuildShaders(
    cellBO: any,
    ren: vtkRenderer,
    actor: vtkActor2D
  ): boolean;

  /**
   * Invoke the user supplied shader callbacks registered on the renderable.
   * @param cellBO
   * @param {vtkRenderer} ren
   * @param {vtkActor2D} actor
   */
  invokeShaderCallbacks(cellBO: any, ren: vtkRenderer, actor: vtkActor2D): void;

  /**
   * @param cellBO
   * @param {vtkRenderer} ren
   * @param {vtkActor2D} actor
   */
  setMapperShaderParameters(
    cellBO: any,
    ren: vtkRenderer,
    actor: vtkActor2D
  ): void;

  /**
   * @param cellBO
   * @param {vtkRenderer} ren
   * @param {vtkActor2D} actor
   */
  setPropertyShaderParameters(
    cellBO: any,
    ren: vtkRenderer,
    actor: vtkActor2D
  ): void;

  /**
   * @param cellBO
   * @param {vtkRenderer} ren
   * @param {vtkActor2D} actor
   */
  setLightingShaderParameters(
    cellBO: any,
    ren: vtkRenderer,
    actor: vtkActor2D
  ): void;

  /**
   * @param cellBO
   * @param {vtkRenderer} ren
   * @param {vtkActor2D} actor
   */
  setCameraShaderParameters(
    cellBO: any,
    ren: vtkRenderer,
    actor: vtkActor2D
  ): void;

  /**
   * @param {vtkRenderer} ren
   * @param {vtkActor2D} actor
   */
  renderPiece(ren: vtkRenderer, actor: vtkActor2D): void;

  /**
   * @param {vtkRenderer} ren
   * @param {vtkActor2D} actor
   */
  renderPieceStart(ren: vtkRenderer, actor: vtkActor2D): void;

  /**
   * @param {vtkRenderer} ren
   * @param {vtkActor2D} actor
   */
  renderPieceDraw(ren: vtkRenderer, actor: vtkActor2D): void;

  /**
   * @param {vtkRenderer} ren
   * @param {vtkActor2D} actor
   */
  renderPieceFinish(ren: vtkRenderer, actor: vtkActor2D): void;

  /**
   * Rebuild the buffer objects when they are out of date.
   * @param {vtkRenderer} ren
   * @param {vtkActor2D} actor
   */
  updateBufferObjects(ren: vtkRenderer, actor: vtkActor2D): void;

  /**
   * @param {vtkRenderer} ren
   * @param {vtkActor2D} actor
   */
  getNeedToRebuildBufferObjects(ren: vtkRenderer, actor: vtkActor2D): boolean;

  /**
   * @param {vtkRenderer} ren
   * @param {vtkActor2D} actor
   */
  buildBufferObjects(ren: vtkRenderer, actor: vtkActor2D): void;

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
 * Method used to decorate a given object (publicAPI+model) with vtkOpenGLPolyDataMapper2D characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IOpenGLPolyDataMapper2DInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IOpenGLPolyDataMapper2DInitialValues
): void;

/**
 * Method used to create a new instance of vtkOpenGLPolyDataMapper2D.
 * @param {IOpenGLPolyDataMapper2DInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IOpenGLPolyDataMapper2DInitialValues
): vtkOpenGLPolyDataMapper2D;

/**
 * The OpenGL backend view node for vtkMapper2D.
 */
export declare const vtkOpenGLPolyDataMapper2D: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkOpenGLPolyDataMapper2D;
