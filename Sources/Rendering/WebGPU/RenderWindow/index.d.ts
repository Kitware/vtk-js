/// <reference types="@webgpu/types" />

import { Nullable, Size, Vector2 } from '../../../types';
import { vtkSubscription } from '../../../interfaces';
import {
  IRenderWindowViewNodeInitialValues,
  vtkRenderWindowViewNode,
} from '../../SceneGraph/RenderWindowViewNode';
import { vtkViewNode } from '../../SceneGraph/ViewNode';
import vtkRenderPass from '../../SceneGraph/RenderPass';
import vtkRenderer from '../../Core/Renderer';
import vtkViewStream from '../../../IO/Core/ImageStream/ViewStream';
import vtkWebGPUDevice from '../Device';
import vtkWebGPUViewNodeFactory from '../ViewNodeFactory';

export interface IWebGPURenderWindowInitialValues extends IRenderWindowViewNodeInitialValues {
  initialized?: boolean;
  initializing?: boolean;
  handlingDeviceLost?: boolean;
  deviceGeneration?: number;
  deviceLostInfo?: Nullable<GPUDeviceLostInfo>;
  context?: Nullable<GPUCanvasContext>;
  adapter?: Nullable<GPUAdapter>;
  device?: Nullable<vtkWebGPUDevice>;
  canvas?: Nullable<HTMLCanvasElement>;
  cursorVisibility?: boolean;
  cursor?: string;
  containerSize?: Nullable<Size>;
  renderPasses?: vtkRenderPass[];
  notifyStartCaptureImage?: boolean;
  imageFormat?: string;
  useOffScreen?: boolean;
  useBackgroundImage?: boolean;
  nextPropID?: number;
  xrSupported?: boolean;
  presentationFormat?: Nullable<GPUTextureFormat>;
}

export interface IWebGPUCaptureOptions {
  resetCamera?: boolean | ((options: { renderer: vtkRenderer }) => void);
  size?: Nullable<Vector2>;
  scale?: number;
}

/**
 * The payload of the deviceLost event.
 */
export interface IWebGPUDeviceLostEvent {
  reason: GPUDeviceLostReason;
  message: string;

  /**
   * False when the device was lost because it was destroyed, in which case no
   * new device is acquired.
   */
  recoverable: boolean;
}

/**
 * The payload of the windowResize event.
 */
export interface IWebGPUWindowResizeEvent {
  width: number;
  height: number;
}

/**
 * The pixels read back from the color texture of the forward pass.
 */
export interface IWebGPUPixels {
  width: number;
  height: number;

  /**
   * The width, in texels, of the readback buffer. Rounded up so that a row is
   * a multiple of 256 bytes, as WebGPU requires.
   */
  colorBufferWidth: number;
  colorBufferSizeInBytes: number;

  /**
   * The RGBA values of the image, tightly packed at `width` texels per row.
   */
  colorValues: Uint8ClampedArray;
}

export interface vtkWebGPURenderWindow extends vtkRenderWindowViewNode {
  /**
   * Get the factory creating the WebGPU view nodes of this render window.
   */
  getViewNodeFactory(): vtkWebGPUViewNodeFactory;

  /**
   * Reconfigure the canvas context for the current device and size.
   */
  recreateSwapChain(): void;

  /**
   * Get the texture the canvas context is presenting this frame.
   */
  getCurrentTexture(): GPUTexture;

  /**
   * Builds myself: adopt the renderers of the renderable as children and, on
   * the second visit, create the command encoder of the frame.
   * @param {Boolean} prepass
   */
  buildPass(prepass: boolean): void;

  /**
   * Start acquiring the adapter, the device and the canvas context, unless
   * that is already under way. The initialized event fires once they are
   * available.
   */
  initialize(): void;

  /**
   * Move the canvas into a container element.
   * @param {HTMLElement} el The container element.
   */
  setContainer(el: Nullable<HTMLElement>): void;

  /**
   * Get the container element.
   */
  getContainer(): Nullable<HTMLElement>;

  /**
   * Get the size of the container element, falling back to the size of the
   * render window when there is no container.
   */
  getContainerSize(): Vector2;

  /**
   * Get the frame buffer size.
   */
  getFramebufferSize(): Vector2;

  /**
   * Request the adapter and the device, watch the device for loss, and get
   * the WebGPU context of the canvas. Resolves once the context is ready, or
   * early when the render window was deleted while waiting.
   */
  create3DContextAsync(): Promise<void>;

  /**
   * Release the resources of the render passes and of every view node, and
   * drop the adapter, device and context. The render window initializes again
   * on the next traversal.
   */
  releaseGraphicsResources(): void;

  /**
   * @param {HTMLImageElement} img The background image.
   */
  setBackgroundImage(img: HTMLImageElement): void;

  /**
   * Add or remove the background image from the container.
   * @param {Boolean} value
   */
  setUseBackgroundImage(value: boolean): void;

  /**
   * Capture a screenshot of the contents of this render window. The options
   * object can include a `size` array (`[w, h]`) or a `scale` floating point
   * value, as well as a `resetCamera` boolean. Returns a promise that
   * resolves to the captured screenshot, or null when the render window was
   * already deleted.
   * @param {String} format
   * @param {IWebGPUCaptureOptions} options
   */
  captureNextImage(
    format?: string,
    options?: IWebGPUCaptureOptions
  ): Nullable<Promise<string>>;

  /**
   * Traverse the render passes, submitting the command encoder of the frame
   * when they are done. Queues the traversal until the device is available
   * when the render window is not initialized yet.
   */
  traverseAllPasses(): void;

  /**
   * @param {vtkViewStream} stream The vtkViewStream instance.
   */
  setViewStream(stream: vtkViewStream): boolean;

  /**
   * Get an id no other prop of this render window uses, for hardware
   * selection.
   */
  getUniquePropID(): number;

  /**
   * Get the view node of the prop holding an id, or null when none does.
   * @param {Number} id
   */
  getPropFromID(id: number): Nullable<vtkViewNode>;

  /**
   * Read the color texture of the forward pass back into a tightly packed
   * RGBA array.
   */
  getPixelsAsync(): Promise<IWebGPUPixels>;

  /**
   * Create a hardware selector bound to this render window.
   */
  createSelector(): any;

  /**
   * Sets the pixel width and height of the rendered image, and fires the
   * windowResizeEvent when they changed.
   * @param {Vector2} size
   */
  setSize(size: Vector2): boolean;

  /**
   * @param {Number} x
   * @param {Number} y
   */
  setSize(x: number, y: number): boolean;

  /**
   */
  getSize(): Vector2;

  /**
   */
  getSizeByReference(): Vector2;

  /**
   * @param {Vector2} size
   */
  setSizeFrom(size: Vector2): void;

  /**
   * Get the command encoder of the frame being built.
   */
  getCommandEncoder(): Nullable<GPUCommandEncoder>;

  /**
   * Get the information of the last device loss, or null when the device was
   * never lost or was reacquired.
   */
  getDeviceLostInfo(): Nullable<GPUDeviceLostInfo>;

  /**
   * Get the device this render window renders with.
   */
  getDevice(): Nullable<vtkWebGPUDevice>;

  /**
   * Set the device this render window renders with.
   * @param {vtkWebGPUDevice} device
   */
  setDevice(device: Nullable<vtkWebGPUDevice>): boolean;

  /**
   * Get the texture format the canvas context is configured with.
   */
  getPresentationFormat(): Nullable<GPUTextureFormat>;

  /**
   * Whether the background image is attached to the container.
   */
  getUseBackgroundImage(): boolean;

  /**
   */
  getXrSupported(): boolean;

  /**
   * Whether the device and the canvas context are ready.
   */
  getInitialized(): boolean;

  /**
   * @param {Boolean} initialized
   */
  setInitialized(initialized: boolean): boolean;

  /**
   * Get the WebGPU context of the canvas.
   */
  getContext(): Nullable<GPUCanvasContext>;

  /**
   * @param {GPUCanvasContext} context
   */
  setContext(context: Nullable<GPUCanvasContext>): boolean;

  /**
   * Get the canvas rendered into.
   */
  getCanvas(): Nullable<HTMLCanvasElement>;

  /**
   * @param {HTMLCanvasElement} canvas
   */
  setCanvas(canvas: Nullable<HTMLCanvasElement>): boolean;

  /**
   * Get the render passes traversed on every render.
   */
  getRenderPasses(): vtkRenderPass[];

  /**
   * @param {vtkRenderPass[]} renderPasses
   */
  setRenderPasses(renderPasses: vtkRenderPass[]): boolean;

  /**
   * Whether the image ready event fires once the frame is done.
   */
  getNotifyStartCaptureImage(): boolean;

  /**
   * @param {Boolean} notifyStartCaptureImage
   */
  setNotifyStartCaptureImage(notifyStartCaptureImage: boolean): boolean;

  /**
   * Get the CSS cursor of the container.
   */
  getCursor(): string;

  /**
   * @param {String} cursor
   */
  setCursor(cursor: string): boolean;

  /**
   * Whether the canvas is hidden.
   */
  getUseOffScreen(): boolean;

  /**
   * @param {Boolean} useOffScreen
   */
  setUseOffScreen(useOffScreen: boolean): boolean;

  /**
   * Call any registered callbacks with the captured image URL.
   * @param {String} imageURL
   */
  invokeImageReady(imageURL: string): void;

  /**
   * Register a callback to be called whenever a captured image becomes ready.
   * @param callback
   */
  onImageReady(
    callback: (imageURL: string) => any,
    priority?: number
  ): vtkSubscription;

  /**
   * Call any registered callbacks once the device and the context are ready.
   */
  invokeInitialized(): void;

  /**
   * Register a callback to be called once the device and the context are
   * ready.
   * @param callback
   */
  onInitialized(callback: () => any, priority?: number): vtkSubscription;

  /**
   * Call any registered callbacks with the reason the device was lost.
   * @param {IWebGPUDeviceLostEvent} event
   */
  invokeDeviceLost(event: IWebGPUDeviceLostEvent): void;

  /**
   * Register a callback to be called whenever the device is lost.
   * @param callback
   */
  onDeviceLost(
    callback: (event: IWebGPUDeviceLostEvent) => any,
    priority?: number
  ): vtkSubscription;

  /**
   * Call any registered callbacks whenever setSize() changes the size.
   * @param {IWebGPUWindowResizeEvent} size
   */
  invokeWindowResizeEvent(size: IWebGPUWindowResizeEvent): void;

  /**
   * Register a callback to be called whenever setSize() changes the size.
   * @param callback
   */
  onWindowResizeEvent(
    callback: (size: IWebGPUWindowResizeEvent) => any,
    priority?: number
  ): vtkSubscription;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPURenderWindow characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPURenderWindowInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPURenderWindowInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPURenderWindow.
 * @param {IWebGPURenderWindowInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPURenderWindowInitialValues
): vtkWebGPURenderWindow;

/**
 * WebGPU rendering window
 *
 * vtkWebGPURenderWindow is designed to view/render a vtkRenderWindow with the
 * WebGPU backend. It owns the canvas, the adapter and the device, and it
 * reacquires them when the device is lost.
 */
export declare const vtkWebGPURenderWindow: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPURenderWindow;
