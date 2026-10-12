import vtkOpenGLCellArrayBufferObject from '../CellArrayBufferObject';
import vtkOpenGLRenderWindow from '../RenderWindow';
import { ITiledSizeAndOrigin } from '../Renderer';
import vtkOpenGLVertexArrayObject from '../VertexArrayObject';
import vtkShaderProgram from '../ShaderProgram';
import vtkActor from '../../Core/Actor';
import vtkRenderer from '../../Core/Renderer';
import { Representation } from '../../Core/Property/Constants';
import { vtkObject } from '../../../interfaces';
import { Nullable } from '../../../types';

/**
 * The primitive a helper draws, and the bounds used to loop over them.
 */
export declare const primTypes: {
  Start: number;
  Points: number;
  Lines: number;
  Tris: number;
  TriStrips: number;
  TrisEdges: number;
  TriStripsEdges: number;
  End: number;
};

/**
 * The GLSL sources a mapper assembles before compiling them into a program.
 */
export interface IShaderSources {
  Vertex: string;
  Fragment: string;
  Geometry: string;
}

/**
 * Initial values for creating a new instance of vtkOpenGLHelper.
 */
export interface IOpenGLHelperInitialValues {
  context?: Nullable<WebGL2RenderingContext>;
  program?: Nullable<vtkShaderProgram>;
  shaderSourceTime?: vtkObject;
  VAO?: Nullable<vtkOpenGLVertexArrayObject>;
  attributeUpdateTime?: vtkObject;
  CABO?: Nullable<vtkOpenGLCellArrayBufferObject>;
  primitiveType?: number;
  pointPicking?: boolean;
}

export interface vtkOpenGLHelper extends vtkObject {
  /**
   * Attach this helper, its vertex array object and its buffers to an OpenGL
   * render window.
   *
   * @param win The OpenGL render window.
   */
  setOpenGLRenderWindow(win: vtkOpenGLRenderWindow): void;

  /**
   * Release the vertex array object and the buffers.
   */
  releaseGraphicsResources(oglwin?: vtkOpenGLRenderWindow): void;

  /**
   * Update the shaders, bind the vertex array object and issue the draw call.
   *
   * @param {vtkRenderer} ren The renderer being drawn.
   * @param {vtkActor} actor The actor being drawn.
   * @param rep The representation to draw with.
   * @param oglMapper The OpenGL mapper driving this helper.
   * @returns {number} The number of primitives drawn.
   */
  drawArrays(
    ren: vtkRenderer,
    actor: vtkActor,
    rep: Representation,
    oglMapper: any
  ): number;

  /**
   * Get the GL draw mode for this helper's primitive, `POINTS` while point
   * picking.
   *
   * @param rep The representation to draw with.
   */
  getOpenGLMode(rep: Representation): number;

  /**
   * Whether the lines must be emulated with instanced quads because the
   * hardware does not support the requested line width.
   *
   * @param {vtkRenderer} ren The renderer being drawn.
   * @param {vtkActor} actor The actor being drawn.
   */
  haveWideLines(ren: vtkRenderer, actor: vtkActor): boolean;

  /**
   * Whether the shader program must be rebuilt before the next draw.
   *
   * @param {vtkRenderer} ren The renderer being drawn.
   * @param {vtkActor} actor The actor being drawn.
   * @param oglMapper The OpenGL mapper driving this helper.
   */
  getNeedToRebuildShaders(
    ren: vtkRenderer,
    actor: vtkActor,
    oglMapper: any
  ): boolean;

  /**
   * Rebuild the program if needed, bind it and let the mapper set its uniforms.
   *
   * @param {vtkRenderer} ren The renderer being drawn.
   * @param {vtkActor} actor The actor being drawn.
   * @param oglMapper The OpenGL mapper driving this helper.
   */
  updateShaders(ren: vtkRenderer, actor: vtkActor, oglMapper: any): void;

  /**
   * Set the wide line and point size uniforms.
   *
   * @param {vtkRenderer} ren The renderer being drawn.
   * @param {vtkActor} actor The actor being drawn.
   * @param {ITiledSizeAndOrigin} size The pixel extent of the viewport.
   */
  setMapperShaderParameters(
    ren: vtkRenderer,
    actor: vtkActor,
    size: ITiledSizeAndOrigin
  ): void;

  /**
   * Add the point size and, for wide lines, the line widening code to the
   * vertex shader.
   *
   * @param {IShaderSources} shaders The shader sources to substitute into.
   * @param {vtkRenderer} ren The renderer being drawn.
   * @param {vtkActor} actor The actor being drawn.
   */
  replaceShaderPositionVC(
    shaders: IShaderSources,
    ren: vtkRenderer,
    actor: vtkActor
  ): void;

  /**
   * Get the point size in pixels used to make this helper's primitive pickable.
   */
  getPointPickingPrimitiveSize(): number;

  /**
   * Get the amount of GPU memory this helper's buffers hold, in bytes.
   */
  getAllocatedGPUMemoryInBytes(): number;

  /**
   * Get the shader program this helper draws with.
   */
  getProgram(): Nullable<vtkShaderProgram>;

  /**
   * Set the shader program this helper draws with.
   * @param program The shader program.
   */
  setProgram(program: Nullable<vtkShaderProgram>): boolean;

  /**
   * Get the time object tracking when the shader sources were last rebuilt.
   */
  getShaderSourceTime(): vtkObject;

  /**
   * Set the time object tracking when the shader sources were last rebuilt.
   * @param shaderSourceTime The time object.
   */
  setShaderSourceTime(shaderSourceTime: vtkObject): boolean;

  /**
   * Get the vertex array object.
   */
  getVAO(): vtkOpenGLVertexArrayObject;

  /**
   * Set the vertex array object.
   * @param VAO The vertex array object.
   */
  setVAO(VAO: vtkOpenGLVertexArrayObject): boolean;

  /**
   * Get the time object tracking when the attributes were last bound.
   */
  getAttributeUpdateTime(): vtkObject;

  /**
   * Set the time object tracking when the attributes were last bound.
   * @param attributeUpdateTime The time object.
   */
  setAttributeUpdateTime(attributeUpdateTime: vtkObject): boolean;

  /**
   * Get the cell array buffer object holding the packed vertices.
   */
  getCABO(): vtkOpenGLCellArrayBufferObject;

  /**
   * Set the cell array buffer object holding the packed vertices.
   * @param CABO The cell array buffer object.
   */
  setCABO(CABO: vtkOpenGLCellArrayBufferObject): boolean;

  /**
   * Get which of the `primTypes` this helper draws.
   */
  getPrimitiveType(): number;

  /**
   * Set which of the `primTypes` this helper draws.
   * @param primitiveType The primitive type.
   */
  setPrimitiveType(primitiveType: number): boolean;

  /**
   * Whether the helper draws points for hardware point picking.
   */
  getPointPicking(): boolean;

  /**
   * Set whether the helper draws points for hardware point picking.
   * @param pointPicking The point picking flag.
   */
  setPointPicking(pointPicking: boolean): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkOpenGLHelper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IOpenGLHelperInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IOpenGLHelperInitialValues
): void;

/**
 * Method used to create a new instance of vtkOpenGLHelper.
 * @param {IOpenGLHelperInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IOpenGLHelperInitialValues
): vtkOpenGLHelper;

export declare const vtkOpenGLHelper: {
  newInstance: typeof newInstance;
  extend: typeof extend;
  primTypes: typeof primTypes;
};
export default vtkOpenGLHelper;
