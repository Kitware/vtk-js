import { Nullable, TypedArray } from '../../../types';
import type { vtkFramebuffer } from '../Framebuffer';
import {
  IRenderPassInitialValues,
  vtkRenderPass,
} from '../../SceneGraph/RenderPass';

/**
 *
 */
export interface IConvolution2DPassInitialValues extends IRenderPassInitialValues {
  framebuffer?: Nullable<vtkFramebuffer>;
  convolutionShader?: any;

  /**
   * The convolution kernel, in row-major form.
   * @default [0, 0, 0, 0, 1, 0, 0, 0, 0]
   */
  kernel?: Nullable<number[] | TypedArray>;

  /**
   * @default 3
   */
  oldKernelDimension?: number;

  /**
   * @default 3
   */
  kernelDimension?: number;
}

export interface vtkConvolution2DPass extends vtkRenderPass {
  /**
   * Build the vertex buffer of the screen-aligned quad the convolved result is
   * drawn to.
   */
  buildVertexBuffer(): void;

  /**
   * Sum the kernel components to get the weight the convolved color is divided
   * by. A kernel that sums to zero or less weighs 1, leaving the result unscaled.
   *
   * @param {Number[]|TypedArray} kernel The convolution kernel.
   */
  computeKernelWeight(kernel: number[] | TypedArray): number;

  /**
   * Get the framebuffer the delegate passes render into, or `null` before the
   * first traversal.
   */
  getFramebuffer(): Nullable<vtkFramebuffer>;

  /**
   * Generate the fragment shader that convolves the delegate output with a
   * kernel of the given dimension. The kernel is unrolled into the source, so
   * a new dimension needs a new shader.
   *
   * @param {Number} kernelDimension The width and height of the square kernel.
   */
  getFragmentShaderCode(kernelDimension: number): string;

  /**
   * Get the convolution kernel, in row-major form.
   * @default [0, 0, 0, 0, 1, 0, 0, 0, 0]
   */
  getKernel(): Nullable<number[] | TypedArray>;

  /**
   * Get the width and height of the square convolution kernel.
   * @default 3
   */
  getKernelDimension(): number;

  /**
   * Set the convolution kernel. It has to be a flat, row-major array of
   * `kernelDimension * kernelDimension` components. Setting it to `null` makes
   * the next traversal rebuild the identity kernel, which leaves the delegate
   * output untouched.
   *
   * @param {Number[]|TypedArray} kernel The convolution kernel.
   */
  setKernel(kernel: Nullable<number[] | TypedArray>): boolean;

  /**
   * Set the width and height of the square convolution kernel. It has to be
   * odd, so that the kernel has a center.
   *
   * @param {Number} kernelDimension The kernel dimension.
   */
  setKernelDimension(kernelDimension: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkConvolution2DPass characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IConvolution2DPassInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IConvolution2DPassInitialValues
): void;

/**
 * Method used to create a new instance of vtkConvolution2DPass.
 * @param {IConvolution2DPassInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IConvolution2DPassInitialValues
): vtkConvolution2DPass;

/**
 * vtkConvolution2DPass is a render pass that post-processes the output of its
 * delegate passes with a 2D convolution kernel, for effects such as sharpening
 * or blurring. The delegates render into an offscreen framebuffer, which is
 * then convolved onto a screen-aligned quad.
 */
declare const vtkConvolution2DPass: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkConvolution2DPass;
