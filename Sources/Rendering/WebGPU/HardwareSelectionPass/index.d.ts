import { Nullable } from '../../../types';
import {
  IRenderPassInitialValues,
  vtkRenderPass,
} from '../../SceneGraph/RenderPass';
import vtkWebGPURenderEncoder from '../RenderEncoder';
import vtkWebGPURenderer from '../Renderer';
import vtkWebGPURenderWindow from '../RenderWindow';
import vtkWebGPUTexture from '../Texture';

export interface IWebGPUHardwareSelectionPassInitialValues extends IRenderPassInitialValues {
  selectionRenderEncoder?: Nullable<vtkWebGPURenderEncoder>;
  colorTexture?: Nullable<vtkWebGPUTexture>;
  depthTexture?: Nullable<vtkWebGPUTexture>;
}

/**
 * `traverse` takes the render window view node and the renderer view node
 * here rather than the view node and parent of the base class, so the
 * inherited signature is replaced.
 */
type vtkWebGPUHardwareSelectionPassBase = Omit<vtkRenderPass, 'traverse'>;

export interface vtkWebGPUHardwareSelectionPass extends vtkWebGPUHardwareSelectionPassBase {
  /**
   * Render the opaque actors of a renderer into an rgba32uint texture holding
   * the prop, composite and attribute ids of every fragment, allocating or
   * resizing the color and depth textures to the canvas first.
   *
   * @param {vtkWebGPURenderWindow} viewNode The render window view node.
   * @param {vtkWebGPURenderer} renNode The renderer view node to traverse.
   */
  traverse(viewNode: vtkWebGPURenderWindow, renNode: vtkWebGPURenderer): void;

  /**
   * Create the render encoder the selection ids are written through,
   * including the shader replacement packing them into the color attachment.
   */
  createRenderEncoder(): void;

  /**
   * Get the rgba32uint texture holding the selection ids, or `null` before
   * the first traversal.
   */
  getColorTexture(): Nullable<vtkWebGPUTexture>;

  /**
   * Get the depth32float texture this pass renders into, or `null` before the
   * first traversal.
   */
  getDepthTexture(): Nullable<vtkWebGPUTexture>;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUHardwareSelectionPass characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUHardwareSelectionPassInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUHardwareSelectionPassInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUHardwareSelectionPass.
 * @param {IWebGPUHardwareSelectionPassInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUHardwareSelectionPassInitialValues
): vtkWebGPUHardwareSelectionPass;

/**
 * vtkWebGPUHardwareSelectionPass renders the scene into an integer texture
 * whose texels hold `[propID, compositeID, attributeID + 1, unused]`, which
 * vtkWebGPUHardwareSelector reads back to resolve a pick.
 */
export declare const vtkWebGPUHardwareSelectionPass: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUHardwareSelectionPass;
