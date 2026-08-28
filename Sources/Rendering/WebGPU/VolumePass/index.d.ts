import { Nullable } from '../../../types';
import {
  IRenderPassInitialValues,
  vtkRenderPass,
} from '../../SceneGraph/RenderPass';
import { vtkWebGPURenderer } from '../Renderer';
import { vtkWebGPURenderWindow } from '../RenderWindow';
import { vtkWebGPUTextureView } from '../TextureView';
import { vtkWebGPUVolume } from '../Volume';

export interface IWebGPUVolumePassInitialValues extends IRenderPassInitialValues {
  colorTextureView?: Nullable<vtkWebGPUTextureView>;
  depthTextureView?: Nullable<vtkWebGPUTextureView>;
  volumes?: Nullable<vtkWebGPUVolume[]>;
}

export interface vtkWebGPUVolumePass extends vtkRenderPass {
  /**
   * Create the encoders, textures and full screen quads this pass renders
   * with. Anything already created is left alone.
   *
   * @param {vtkWebGPURenderWindow} viewNode
   */
  initialize(viewNode: vtkWebGPURenderWindow): void;

  /**
   * Decide whether the ray cast pass should render into a reduced viewport,
   * based on the interactor's animation frame rate and the mappers' sample
   * distance settings.
   *
   * @param {vtkWebGPURenderWindow} viewNode
   */
  computeTiming(viewNode: vtkWebGPURenderWindow): void;

  /**
   * Create the encoder that clears the volume color texture before the first
   * group of volumes is ray cast.
   *
   * @param {vtkWebGPURenderWindow} viewNode
   */
  createClearEncoder(viewNode: vtkWebGPURenderWindow): void;

  /**
   * Create the encoder that blends the volume color texture back into the
   * render window's color attachment.
   *
   * @param {vtkWebGPURenderWindow} viewNode
   */
  createCopyEncoder(viewNode: vtkWebGPURenderWindow): void;

  /**
   * Create the encoder that renders the volume bounding boxes into the two
   * min/max depth textures.
   *
   * @param {vtkWebGPURenderWindow} viewNode
   */
  createDepthRangeEncoder(viewNode: vtkWebGPURenderWindow): void;

  /**
   * Create the encoder that composites a later group of volumes onto the
   * result of the previous groups.
   *
   * @param {vtkWebGPURenderWindow} viewNode
   */
  createMergeEncoder(viewNode: vtkWebGPURenderWindow): void;

  /**
   * Render the bounding box geometry to fill the min and max depth textures
   * the ray cast pass samples between.
   *
   * @param {vtkWebGPURenderer} renNode
   * @param {vtkWebGPURenderWindow} viewNode
   */
  drawDepthRange(
    renNode: vtkWebGPURenderer,
    viewNode: vtkWebGPURenderWindow
  ): void;

  /**
   * Ray cast one group of volumes into the volume color texture.
   *
   * @param {vtkWebGPURenderWindow} viewNode
   * @param {vtkWebGPURenderer} renNode
   * @param {vtkWebGPUVolume[]} volumes The group of volumes to render.
   */
  rayCastPass(
    viewNode: vtkWebGPURenderWindow,
    renNode: vtkWebGPURenderer,
    volumes: vtkWebGPUVolume[]
  ): void;

  /**
   * Free the encoders, textures, quads and buffers this pass holds.
   */
  releaseGraphicsResources(): void;

  /**
   * Build the bounding box polydata, upload it and draw it through the depth
   * range encoder.
   *
   * @param {vtkWebGPURenderer} renNode
   * @param {vtkWebGPURenderWindow} viewNode
   */
  renderDepthBounds(
    renNode: vtkWebGPURenderer,
    viewNode: vtkWebGPURenderWindow
  ): void;

  /**
   * Rebuild the polydata holding one cube per volume, clipped against the
   * camera near plane, in stabilized coordinates.
   *
   * @param {vtkWebGPURenderer} renNode
   */
  updateDepthPolyData(renNode: vtkWebGPURenderer): void;

  /**
   * Render the volumes of a renderer: depth bounds first, then one ray cast
   * pass per group of volumes, then a copy back into the render window.
   *
   * @param {vtkWebGPURenderer} renNode
   * @param {vtkWebGPURenderWindow} viewNode
   */
  traverse(renNode: vtkWebGPURenderer, viewNode: vtkWebGPURenderWindow): void;

  /**
   * Get the color texture view this pass composites its result into.
   */
  getColorTextureView(): Nullable<vtkWebGPUTextureView>;

  /**
   * Set the color texture view this pass composites its result into.
   */
  setColorTextureView(
    colorTextureView: Nullable<vtkWebGPUTextureView>
  ): boolean;

  /**
   * Get the depth texture view geometry has already been rendered into.
   */
  getDepthTextureView(): Nullable<vtkWebGPUTextureView>;

  /**
   * Set the depth texture view geometry has already been rendered into.
   */
  setDepthTextureView(
    depthTextureView: Nullable<vtkWebGPUTextureView>
  ): boolean;

  /**
   * Set the volumes this pass renders, marking the pass modified only when the
   * list actually changed.
   *
   * @param {vtkWebGPUVolume[]} val
   */
  setVolumes(val: vtkWebGPUVolume[]): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUVolumePass characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUVolumePassInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUVolumePassInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUVolumePass.
 * @param {IWebGPUVolumePassInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUVolumePassInitialValues
): vtkWebGPUVolumePass;

/**
 * vtkWebGPUVolumePass renders the volumes of a renderer in two sub passes. The
 * first rasterizes a bounding cube per volume to compute the minimum and
 * maximum depth to march between, the second ray casts the volumes between
 * those bounds and blends the result back into the render window.
 */
declare const vtkWebGPUVolumePass: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUVolumePass;
