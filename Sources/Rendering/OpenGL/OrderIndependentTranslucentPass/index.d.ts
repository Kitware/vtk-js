import { Nullable } from '../../../types';
import type { vtkFramebuffer } from '../Framebuffer';
import vtkOpenGLRenderWindow from '../RenderWindow';
import { vtkViewNode } from '../../SceneGraph/ViewNode';
import { vtkForwardPass } from '../ForwardPass';
import {
  IRenderPassInitialValues,
  vtkRenderPass,
} from '../../SceneGraph/RenderPass';

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
export interface IOrderIndependentTranslucentPassInitialValues extends IRenderPassInitialValues {
  framebuffer?: Nullable<vtkFramebuffer>;
  copyShader?: any;
  tris?: any;
}

/**
 * `traverse` takes three arguments here rather than the two of the base class,
 * so the inherited signature is replaced.
 */
type vtkOpenGLOrderIndependentTranslucentPassBase = Omit<
  vtkRenderPass,
  'traverse'
>;

export interface vtkOpenGLOrderIndependentTranslucentPass extends vtkOpenGLOrderIndependentTranslucentPassBase {
  /**
   * Build the shader program that resolves the two accumulation buffers onto
   * a screen-aligned quad.
   *
   * @param {vtkOpenGLRenderWindow} viewNode The render window view node.
   */
  createCopyShader(viewNode: vtkOpenGLRenderWindow): void;

  /**
   * Allocate the offscreen framebuffer the translucent geometry accumulates
   * into, along with its RGBA, R and depth attachments.
   *
   * @param {vtkOpenGLRenderWindow} viewNode The render window view node.
   */
  createFramebuffer(viewNode: vtkOpenGLRenderWindow): void;

  /**
   * Build the vertex array object binding the quad vertex buffer to the copy
   * shader.
   *
   * @param {vtkOpenGLRenderWindow} viewNode The render window view node.
   */
  createVBO(viewNode: vtkOpenGLRenderWindow): void;

  /**
   * Build the vertex buffer of the screen-aligned quad the resolved color is
   * drawn to.
   */
  createVertexBuffer(): void;

  /**
   * Get the framebuffer the translucent geometry accumulates into, or `null`
   * before the first traversal.
   */
  getFramebuffer(): Nullable<vtkFramebuffer>;

  /**
   * Get the shader replacement that turns a mapper's fragment output into the
   * weighted-blended accumulation this pass resolves, or `null` when the
   * context lacks the float color buffer support the pass needs.
   */
  getShaderReplacement(): Nullable<(shaders: IShaderSources) => void>;

  /**
   * Release the framebuffer, its textures, the copy shader and its vertex
   * array object.
   *
   * @param {vtkOpenGLRenderWindow} viewNode The render window view node.
   */
  releaseGraphicsResources(viewNode: vtkOpenGLRenderWindow): void;

  /**
   * Render the translucent actors of a renderer with order-independent
   * transparency, then resolve the accumulation buffers onto the current
   * framebuffer. Falls back to plain alpha blending when the context has no
   * float color buffer extension or a hardware selector is active.
   *
   * @param {vtkOpenGLRenderWindow} viewNode The render window view node.
   * @param {vtkViewNode} renNode The renderer view node to traverse.
   * @param {vtkForwardPass} forwardPass The forward pass driving this pass.
   */
  traverse(
    viewNode: vtkOpenGLRenderWindow,
    renNode: vtkViewNode,
    forwardPass: vtkForwardPass
  ): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkOpenGLOrderIndependentTranslucentPass characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IOrderIndependentTranslucentPassInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IOrderIndependentTranslucentPassInitialValues
): void;

/**
 * Method used to create a new instance of vtkOpenGLOrderIndependentTranslucentPass.
 * @param {IOrderIndependentTranslucentPassInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IOrderIndependentTranslucentPassInitialValues
): vtkOpenGLOrderIndependentTranslucentPass;

/**
 * vtkOpenGLOrderIndependentTranslucentPass renders translucent geometry with
 * weighted blended order-independent transparency. Color and weight accumulate
 * into two float attachments of an offscreen framebuffer, which are then
 * resolved onto a screen-aligned quad, so the result does not depend on the
 * order the translucent actors are drawn in.
 */
declare const vtkOpenGLOrderIndependentTranslucentPass: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkOpenGLOrderIndependentTranslucentPass;
