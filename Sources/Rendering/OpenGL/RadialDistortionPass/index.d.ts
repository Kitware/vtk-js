import { Nullable } from '../../../types';
import type { vtkFramebuffer } from '../Framebuffer';
import {
  IRenderPassInitialValues,
  vtkRenderPass,
} from '../../SceneGraph/RenderPass';

/**
 *
 */
export interface IRadialDistortionPassInitialValues extends IRenderPassInitialValues {
  copyShader?: any;
  framebuffer?: Nullable<vtkFramebuffer>;
  tris?: any;

  /**
   * @default 0
   */
  k1?: number;

  /**
   * @default 0
   */
  k2?: number;

  /**
   * @default 0
   */
  cameraCenterX1?: number;

  /**
   * @default 0
   */
  cameraCenterX2?: number;

  /**
   * @default 0
   */
  cameraCenterY?: number;

  /**
   * @default 2
   */
  renderRatio?: number;
}

export interface vtkRadialDistortionPass extends vtkRenderPass {
  /**
   * Build the distorted grid the delegate output is drawn onto. The grid is
   * two side-by-side halves, one per eye, whose texture coordinates carry the
   * radial distortion. Also recomputes the render ratio from `k1` and `k2`.
   */
  buildVBO(): void;

  /**
   * Get the x coordinate of the left half's distortion center, in normalized
   * device coordinates.
   * @default 0
   */
  getCameraCenterX1(): number;

  /**
   * Get the x coordinate of the right half's distortion center, in normalized
   * device coordinates.
   * @default 0
   */
  getCameraCenterX2(): number;

  /**
   * Get the y coordinate of the distortion center, in normalized device
   * coordinates.
   * @default 0
   */
  getCameraCenterY(): number;

  /**
   * Get the framebuffer the delegate passes render into, or `null` before the
   * first traversal.
   */
  getFramebuffer(): Nullable<vtkFramebuffer>;

  /**
   * Get the second-order radial distortion coefficient.
   * @default 0
   */
  getK1(): number;

  /**
   * Get the fourth-order radial distortion coefficient.
   * @default 0
   */
  getK2(): number;

  /**
   * Set the x coordinate of the left half's distortion center.
   * @param {Number} cameraCenterX1
   */
  setCameraCenterX1(cameraCenterX1: number): boolean;

  /**
   * Set the x coordinate of the right half's distortion center.
   * @param {Number} cameraCenterX2
   */
  setCameraCenterX2(cameraCenterX2: number): boolean;

  /**
   * Set the y coordinate of the distortion center.
   * @param {Number} cameraCenterY
   */
  setCameraCenterY(cameraCenterY: number): boolean;

  /**
   * Set the second-order radial distortion coefficient. With both `k1` and
   * `k2` at zero the pass is a no-op and simply forwards to its delegates.
   * @param {Number} k1
   */
  setK1(k1: number): boolean;

  /**
   * Set the fourth-order radial distortion coefficient.
   * @param {Number} k2
   */
  setK2(k2: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkRadialDistortionPass characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IRadialDistortionPassInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IRadialDistortionPassInitialValues
): void;

/**
 * Method used to create a new instance of vtkRadialDistortionPass.
 * @param {IRadialDistortionPassInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IRadialDistortionPassInitialValues
): vtkRadialDistortionPass;

/**
 * vtkRadialDistortionPass renders its delegate passes into an oversized
 * offscreen framebuffer, then draws that texture onto a pre-distorted grid so
 * that the barrel distortion of an HMD lens cancels out. It is a no-op when
 * both distortion coefficients are zero.
 */
declare const vtkRadialDistortionPass: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkRadialDistortionPass;
