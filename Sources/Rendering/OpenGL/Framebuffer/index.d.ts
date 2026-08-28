import { vtkObject } from '../../../interfaces';
import { Nullable, Size } from '../../../types';
import vtkOpenGLRenderWindow from '../RenderWindow';
import vtkOpenGLTexture from '../Texture';

/**
 * The framebuffer object created by `create()`, which carries the dimensions
 * it was created with so that `getSize()` can read them back.
 */
export type SizedWebGLFramebuffer = WebGLFramebuffer & {
  width: number;
  height: number;
};

/**
 * Initial values for creating a new instance of vtkFramebuffer.
 *
 * Note that `colorBuffers` cannot be set here: `extend` rejects it with an
 * error and resets it to an empty array. Use `setColorBuffer()` instead.
 */
export interface IFramebufferInitialValues {
  glFramebuffer?: Nullable<SizedWebGLFramebuffer>;
  depthTexture?: Nullable<WebGLRenderbuffer>;
  previousDrawBinding?: number;
  previousReadBinding?: number;
  previousDrawBuffer?: number;
  previousReadBuffer?: number;
  previousActiveFramebuffer?: Nullable<vtkFramebuffer>;
}

export interface vtkFramebuffer extends vtkObject {
  /**
   * Bind this framebuffer, and every color buffer attached to it, and make it
   * the render window's active framebuffer.
   *
   * @param {Number} [modeArg] The bind target (default: `gl.FRAMEBUFFER`).
   */
  bind(modeArg?: Nullable<number>): void;

  /**
   * Create the underlying WebGL framebuffer at the given size. Does nothing
   * until the OpenGL render window has been set.
   *
   * @param {Number} width
   * @param {Number} height
   */
  create(width: number, height: number): void;

  /**
   * Get the bind target that covers both reading and drawing, `gl.FRAMEBUFFER`.
   */
  getBothMode(): number;

  /**
   * Get a copy of the textures attached as color buffers, indexed by attachment.
   */
  getColorBuffers(): (vtkOpenGLTexture | undefined)[];

  /**
   * Get the textures attached as color buffers, indexed by attachment, without
   * copying the array.
   */
  getColorBuffersByReference(): (vtkOpenGLTexture | undefined)[];

  /**
   * Get the texture attached as the first color buffer, if one is attached.
   *
   * @deprecated Use `getColorBuffers()[0]` instead.
   */
  getColorTexture(): vtkOpenGLTexture | undefined;

  /**
   * Get the underlying WebGL framebuffer, or `null` before `create()`.
   */
  getGLFramebuffer(): Nullable<SizedWebGLFramebuffer>;

  /**
   * Get the width and height the framebuffer was created with, or `null`
   * before `create()`.
   */
  getSize(): Nullable<Size>;

  /**
   * Attach a color texture and a depth renderbuffer sized to the framebuffer,
   * binding it first. Does nothing until the OpenGL render window has been set.
   */
  populateFramebuffer(): void;

  /**
   * Delete the underlying WebGL framebuffer, if one was created.
   */
  releaseGraphicsResources(): void;

  /**
   * Detach the texture bound to the given color attachment.
   *
   * @param {Number} [attachment] The color attachment index (default: 0).
   */
  removeColorBuffer(attachment?: number): void;

  /**
   * Detach the texture bound to the depth attachment.
   */
  removeDepthBuffer(): void;

  /**
   * Restore the bindings and the buffers saved by
   * `saveCurrentBindingsAndBuffers`.
   *
   * @param {Number} [modeIn] The bind target (default: `gl.FRAMEBUFFER`).
   */
  restorePreviousBindingsAndBuffers(modeIn?: number): void;

  /**
   * Rebind the framebuffer that was bound when `saveCurrentBindings` ran, and
   * restore it as the render window's active framebuffer. Does nothing until
   * the OpenGL render window has been set.
   *
   * @param {Number} [modeIn] The bind target.
   */
  restorePreviousBindings(modeIn?: number): void;

  /**
   * A no-op on WebGL, where draw and read buffers are not saved.
   *
   * @param {Number} [modeIn] The bind target.
   */
  restorePreviousBuffers(modeIn?: number): void;

  /**
   * Remember the currently bound framebuffer and the render window's active
   * framebuffer, along with the draw and read buffers, so that
   * `restorePreviousBindingsAndBuffers` can put them back.
   *
   * @param {Number} [modeIn] The bind target (default: `gl.FRAMEBUFFER`).
   */
  saveCurrentBindingsAndBuffers(modeIn?: number): void;

  /**
   * Remember the currently bound framebuffer and the render window's active
   * framebuffer. Does nothing until the OpenGL render window has been set.
   *
   * @param {Number} [modeIn] The bind target.
   */
  saveCurrentBindings(modeIn?: number): void;

  /**
   * A no-op on WebGL, where draw and read buffers cannot be queried.
   *
   * @param {Number} [modeIn] The bind target.
   */
  saveCurrentBuffers(modeIn?: number): void;

  /**
   * Attach a texture to the given color attachment. Does nothing until the
   * OpenGL render window has been set.
   *
   * @param {vtkOpenGLTexture} texture The texture to attach.
   * @param {Number} [attachment] The color attachment index (default: 0).
   */
  setColorBuffer(texture: vtkOpenGLTexture, attachment?: number): void;

  /**
   * Attach a texture to the depth attachment. Does nothing until the OpenGL
   * render window has been set.
   *
   * @param {vtkOpenGLTexture} texture The texture to attach.
   */
  setDepthBuffer(texture: vtkOpenGLTexture): void;

  /**
   * Set the OpenGL render window this framebuffer belongs to, and take its
   * WebGL context. Changing it releases the graphics resources held for the
   * previous one.
   *
   * @param {vtkOpenGLRenderWindow} rw The OpenGL render window.
   */
  setOpenGLRenderWindow(rw: Nullable<vtkOpenGLRenderWindow>): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkFramebuffer characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IFramebufferInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IFramebufferInitialValues
): void;

/**
 * Method used to create a new instance of vtkFramebuffer.
 * @param {IFramebufferInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IFramebufferInitialValues
): vtkFramebuffer;

/**
 * vtkFramebuffer wraps a WebGL framebuffer object, so that a render pass can
 * redirect its output to offscreen textures and then read them back.
 */
declare const vtkFramebuffer: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkFramebuffer;
