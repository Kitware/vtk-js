import { Nullable } from '../../../types';
import { IViewNodeInitialValues, vtkViewNode } from '../../SceneGraph/ViewNode';
import vtkOpenGLHardwareSelector from '../HardwareSelector';
import vtkOpenGLRenderWindow from '../RenderWindow';

/**
 * The pixel extent of this renderer's viewport within the render window.
 */
export interface ITiledSizeAndOrigin {
  usize: number;
  vsize: number;
  lowerLeftU: number;
  lowerLeftV: number;
}

export interface IOpenGLRendererInitialValues extends IViewNodeInitialValues {
  context?: Nullable<WebGL2RenderingContext>;
  _openGLRenderWindow?: Nullable<vtkOpenGLRenderWindow>;
  selector?: Nullable<vtkOpenGLHardwareSelector>;
}

export interface vtkOpenGLRenderer extends vtkViewNode {
  /**
   * Builds myself: adopt the active camera and every view prop of the
   * renderable as children.
   * @param prepass
   */
  buildPass(prepass: boolean): void;

  /**
   * Create a default light when the renderable has none switched on.
   * @returns the number of lights that are on.
   */
  updateLights(): number;

  /**
   * @param prepass
   */
  zBufferPass(prepass: boolean): void;

  /**
   * @param prepass
   */
  opaqueZBufferPass(prepass: boolean): void;

  /**
   * Renders myself.
   * @param prepass
   */
  cameraPass(prepass: boolean): void;

  /**
   * The aspect ratio of this renderer's viewport, in pixels.
   */
  getAspectRatio(): number;

  /**
   * The pixel size and lower-left origin of this renderer's viewport.
   */
  getTiledSizeAndOrigin(): ITiledSizeAndOrigin;

  /**
   * Clear the color and depth buffers over this renderer's viewport, honoring
   * the renderable's transparency and depth buffer preservation flags.
   */
  clear(): void;

  /**
   */
  releaseGraphicsResources(): void;

  /**
   * Rebind this renderer to another render window, releasing the graphics
   * resources held for the previous one.
   * @param {vtkOpenGLRenderWindow} rw
   */
  setOpenGLRenderWindow(rw: Nullable<vtkOpenGLRenderWindow>): void;

  /**
   */
  getShaderCache(): any;

  /**
   */
  getSelector(): Nullable<vtkOpenGLHardwareSelector>;

  /**
   * @param selector
   */
  setSelector(selector: Nullable<vtkOpenGLHardwareSelector>): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkOpenGLRenderer characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IOpenGLRendererInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IOpenGLRendererInitialValues
): void;

/**
 * Method used to create a new instance of vtkOpenGLRenderer.
 * @param {IOpenGLRendererInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IOpenGLRendererInitialValues
): vtkOpenGLRenderer;

/**
 * The OpenGL backend view node for a vtkRenderer.
 */
export declare const vtkOpenGLRenderer: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkOpenGLRenderer;
