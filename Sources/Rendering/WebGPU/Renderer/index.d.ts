import { Nullable, Vector3 } from '../../../types';
import { IViewNodeInitialValues, vtkViewNode } from '../../SceneGraph/ViewNode';
import vtkWebGPUBindGroup from '../BindGroup';
import vtkWebGPUHardwareSelector from '../HardwareSelector';
import vtkWebGPURenderEncoder from '../RenderEncoder';
import vtkWebGPUUniformBuffer from '../UniformBuffer';

/**
 * The pixel extent of this renderer's viewport within the render window.
 */
export interface IWebGPUTiledSizeAndOrigin {
  usize: number;
  vsize: number;
  lowerLeftU: number;
  lowerLeftV: number;
}

export interface IWebGPURendererInitialValues extends IViewNodeInitialValues {
  bindGroup?: Nullable<vtkWebGPUBindGroup>;
  selector?: any;
  renderEncoder?: Nullable<vtkWebGPURenderEncoder>;
  recenterThreshold?: number;
  suppressClear?: boolean;
  stabilizedCenter?: Vector3;
}

export interface vtkWebGPURenderer extends vtkViewNode {
  /**
   * Builds myself: adopt the active camera and every view prop of the
   * renderable as children, and update the stabilized matrix.
   * @param {Boolean} prepass
   */
  buildPass(prepass: boolean): void;

  /**
   * Recenter the stabilized coordinate system when the center of the view
   * frustum has moved far enough, relative to the clipping range, that single
   * precision rendering would suffer.
   */
  updateStabilizedMatrix(): void;

  /**
   * Create a default light when the renderable has none switched on.
   * @returns the number of lights that are on.
   */
  updateLights(): number;

  /**
   * Push the camera matrices, the light count and the viewport size into the
   * renderer uniform buffer, when anything they depend on has changed.
   */
  updateUBO(): void;

  /**
   * Push the light positions, directions, colors and attenuations into the
   * renderer storage buffer, when the lights have changed.
   */
  updateSSBO(): void;

  /**
   * Set the viewport and the scissor rectangle of an encoder to this
   * renderer's viewport.
   * @param {vtkWebGPURenderEncoder} encoder
   */
  scissorAndViewport(encoder: vtkWebGPURenderEncoder): void;

  /**
   * Bind the renderer bind group, holding the uniform and light buffers.
   * @param {vtkWebGPURenderEncoder} renderEncoder
   */
  bindUBO(renderEncoder: vtkWebGPURenderEncoder): void;

  /**
   * Renders myself.
   * @param {Boolean} prepass
   */
  opaquePass(prepass: boolean): void;

  /**
   * @param {Boolean} prepass
   */
  zBufferPass(prepass: boolean): void;

  /**
   * @param {Boolean} prepass
   */
  opaqueZBufferPass(prepass: boolean): void;

  /**
   * Draw the background of the renderer, unless the renderable is transparent
   * or clearing is suppressed.
   */
  clear(): void;

  /**
   * @param {Boolean} prepass
   */
  translucentPass(prepass: boolean): void;

  /**
   * @param {Boolean} prepass
   */
  volumeDepthRangePass(prepass: boolean): void;

  /**
   * The aspect ratio of this renderer's viewport, in pixels.
   */
  getAspectRatio(): number;

  /**
   * Convert a WebGPU depth value to the OpenGL depth convention.
   * @param {Number} val
   */
  convertToOpenGLDepth(val: number): number;

  /**
   * The pixel size and origin of this renderer's viewport, with the origin
   * measured from the top of the render window.
   */
  getYInvertedTiledSizeAndOrigin(): IWebGPUTiledSizeAndOrigin;

  /**
   * The pixel size and lower-left origin of this renderer's viewport.
   */
  getTiledSizeAndOrigin(): IWebGPUTiledSizeAndOrigin;

  /**
   * Get the child node whose prop id matches, or null when none does.
   * @param {Number} id
   */
  getPropFromID(id: number): Nullable<vtkViewNode>;

  /**
   * The modified time of the stabilized coordinate system, which changes
   * whenever the stabilized center is recentered.
   */
  getStabilizedTime(): number;

  /**
   */
  releaseGraphicsResources(): void;

  /**
   * Get the bind group holding the renderer uniform and light buffers.
   */
  getBindGroup(): vtkWebGPUBindGroup;

  /**
   * Get a copy of the center of the stabilized coordinate system, in world
   * coordinates.
   */
  getStabilizedCenter(): Vector3;

  /**
   * Get the center of the stabilized coordinate system without copying it.
   */
  getStabilizedCenterByReference(): Vector3;

  /**
   * Get the encoder this renderer draws its passes into.
   */
  getRenderEncoder(): Nullable<vtkWebGPURenderEncoder>;

  /**
   * Set the encoder this renderer draws its passes into.
   * @param {vtkWebGPURenderEncoder} renderEncoder
   */
  setRenderEncoder(renderEncoder: Nullable<vtkWebGPURenderEncoder>): boolean;

  /**
   * Get the hardware selector currently selecting through this renderer.
   */
  getSelector(): Nullable<vtkWebGPUHardwareSelector>;

  /**
   * Set the hardware selector currently selecting through this renderer.
   * @param selector
   */
  setSelector(selector: Nullable<vtkWebGPUHardwareSelector>): boolean;

  /**
   * Whether clearing the viewport is suppressed, e.g. when another renderer
   * has already drawn into it.
   */
  getSuppressClear(): boolean;

  /**
   * Set whether clearing the viewport is suppressed.
   * @param {Boolean} suppressClear
   */
  setSuppressClear(suppressClear: boolean): boolean;

  /**
   * Get the uniform buffer holding the camera matrices of this renderer.
   */
  getUBO(): vtkWebGPUUniformBuffer;

  /**
   * Set the uniform buffer holding the camera matrices of this renderer.
   * @param {vtkWebGPUUniformBuffer} UBO
   */
  setUBO(UBO: vtkWebGPUUniformBuffer): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPURenderer characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPURendererInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPURendererInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPURenderer.
 * @param {IWebGPURendererInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPURendererInitialValues
): vtkWebGPURenderer;

/**
 * The WebGPU view node of a vtkRenderer: it owns the renderer uniform and
 * light buffers, the stabilized coordinate system, and the viewport of the
 * render passes.
 */
export declare const vtkWebGPURenderer: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPURenderer;
