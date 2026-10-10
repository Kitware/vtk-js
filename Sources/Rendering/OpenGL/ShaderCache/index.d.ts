import vtkOpenGLRenderWindow from '../RenderWindow';
import vtkShaderProgram from '../ShaderProgram';
import { vtkObject } from '../../../interfaces';
import { Nullable } from '../../../types';

/**
 * The three shader sources of a program.
 */
export interface IShaderCacheSources {
  VSSource: string;
  FSSource: string;
  GSSource: string;
}

/**
 * Initial values for creating a new instance of vtkShaderCache.
 */
export interface IShaderCacheInitialValues {
  lastShaderProgramBound?: Nullable<vtkShaderProgram>;
  context?: Nullable<WebGL2RenderingContext>;
  _openGLRenderWindow?: Nullable<vtkOpenGLRenderWindow>;
}

export interface vtkShaderCache extends vtkObject {
  /**
   * Apply the WebGL2 system replacements to the given shader sources.
   *
   * @param VSSource The vertex shader source.
   * @param FSSource The fragment shader source.
   * @param GSSource The geometry shader source.
   * @returns {IShaderCacheSources} The substituted sources.
   */
  replaceShaderValues(
    VSSource: string,
    FSSource: string,
    GSSource: string
  ): IShaderCacheSources;

  /**
   * Get, compile and bind the program matching the given sources.
   *
   * @param vertexCode The vertex shader source.
   * @param fragmentCode The fragment shader source.
   * @param geometryCode The geometry shader source.
   * @returns {Nullable<vtkShaderProgram>} The ready program, or null on failure.
   */
  readyShaderProgramArray(
    vertexCode: string,
    fragmentCode: string,
    geometryCode: string
  ): Nullable<vtkShaderProgram>;

  /**
   * Compile and bind the given program if needed.
   *
   * @param program The program to ready.
   * @returns {Nullable<vtkShaderProgram>} The program, or null on failure.
   */
  readyShaderProgram(
    program: Nullable<vtkShaderProgram>
  ): Nullable<vtkShaderProgram>;

  /**
   * Get the cached program for the given sources, creating it when missing.
   * The sources are used as given: they are not substituted.
   *
   * @param vertexCode The vertex shader source.
   * @param fragmentCode The fragment shader source.
   * @param geometryCode The geometry shader source.
   */
  getShaderProgram(
    vertexCode: string,
    fragmentCode: string,
    geometryCode: string
  ): vtkShaderProgram;

  /**
   * Release every program this cache created and empty the cache.
   */
  releaseGraphicsResources(win?: vtkOpenGLRenderWindow): void;

  /**
   * Release the currently bound program, if any.
   */
  releaseCurrentShaderProgram(): void;

  /**
   * Bind the given program, releasing the previously bound one.
   *
   * @param program The program to bind.
   * @returns {number} 1 always.
   */
  bindShaderProgram(program: vtkShaderProgram): number;

  /**
   * Get the last bound program.
   */
  getLastShaderProgramBound(): Nullable<vtkShaderProgram>;

  /**
   * Set the last bound program.
   * @param lastShaderProgramBound The program.
   */
  setLastShaderProgramBound(
    lastShaderProgramBound: Nullable<vtkShaderProgram>
  ): boolean;

  /**
   * Get the WebGL context.
   */
  getContext(): Nullable<WebGL2RenderingContext>;

  /**
   * Set the WebGL context.
   * @param context The WebGL context.
   */
  setContext(context: Nullable<WebGL2RenderingContext>): boolean;

  /**
   * Get the OpenGL render window this cache belongs to.
   */
  getOpenGLRenderWindow(): Nullable<vtkOpenGLRenderWindow>;

  /**
   * Set the OpenGL render window this cache belongs to.
   * @param openGLRenderWindow The OpenGL render window.
   */
  setOpenGLRenderWindow(
    openGLRenderWindow: Nullable<vtkOpenGLRenderWindow>
  ): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkShaderCache characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IShaderCacheInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IShaderCacheInitialValues
): void;

/**
 * Method used to create a new instance of vtkShaderCache.
 * @param {IShaderCacheInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IShaderCacheInitialValues
): vtkShaderCache;

export declare const vtkShaderCache: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkShaderCache;
