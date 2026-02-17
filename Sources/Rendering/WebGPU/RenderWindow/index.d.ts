import { vtkObject, vtkSubscription } from '../../../interfaces';
import { vtkViewNode } from '../../SceneGraph/ViewNode';

export interface IWebGPURenderWindowInitialValues {
  initialized?: boolean;
  context?: any;
  canvas?: HTMLCanvasElement;
  cursor?: string;
  useOffScreen?: boolean;
  imageFormat?: string;
  useBackgroundImage?: boolean;
  xrSupported?: boolean;
  presentationFormat?: string | null;
  multiSample?: 1 | 4;
  size?: [number, number];
}

/**
 * vtkWebGPURenderWindow is designed to view/render a vtkRenderWindow
 * using the WebGPU API.
 */
export interface vtkWebGPURenderWindow extends vtkViewNode {
  // -------------------------------------------------------------------
  // Explicitly defined methods on publicAPI
  // -------------------------------------------------------------------

  /**
   * Get the view-node factory used to create WebGPU scene-graph nodes.
   */
  getViewNodeFactory(): any;

  /**
   * Unconfigure and reconfigure the swap chain. Called automatically when
   * the canvas size changes.
   */
  recreateSwapChain(): void;

  /**
   * Get the current swap-chain texture from the canvas context.
   */
  getCurrentTexture(): any;

  /**
   * Build pass callback invoked by the scene-graph traversal.
   * @param prepass Whether this is the pre-pass (`true`) or post-pass (`false`).
   */
  buildPass(prepass: boolean): void;

  /**
   * Initialize the render window. Triggers async GPU adapter/device
   * creation; fires the `initialized` event on completion.
   */
  initialize(): void;

  /**
   * Set the container element for the render window.
   * @param el The HTML element to use as the container, or `null` to detach.
   */
  setContainer(el: HTMLElement | null): void;

  /**
   * Get the current container element.
   */
  getContainer(): HTMLElement | null;

  /**
   * Get the size of the container element in pixels.
   * @returns [width, height]
   */
  getContainerSize(): [number, number];

  /**
   * Get the framebuffer size.
   * @returns [width, height]
   */
  getFramebufferSize(): [number, number];

  /**
   * Create the WebGPU 3D context asynchronously. Requests the GPU adapter
   * and device, then configures the canvas context.
   */
  create3DContextAsync(): Promise<void>;

  /**
   * Release all GPU resources and clean up the rendering context.
   */
  releaseGraphicsResources(): void;

  /**
   * Set the background image element.
   * @param img The image element.
   */
  setBackgroundImage(img: HTMLImageElement): void;

  /**
   * Enable or disable rendering of a background image behind the scene.
   * @param value Whether to use the background image.
   */
  setUseBackgroundImage(value: boolean): void;

  /**
   * Capture the next rendered frame as an image.
   * @param format The image format (default: 'image/png').
   * @param opts Options for capture.
   * @param opts.resetCamera Whether to reset the camera before capture.
   * @param opts.size Override the render size as [width, height].
   * @param opts.scale Scale factor for the render size.
   */
  captureNextImage(
    format?: string,
    opts?: { resetCamera?: boolean; size?: [number, number]; scale?: number }
  ): Promise<string>;

  /**
   * Traverse all registered render passes.
   */
  traverseAllPasses(): void;

  /**
   * Set a view stream for remote rendering.
   * @param stream The view stream instance.
   */
  setViewStream(stream: any): boolean;

  /**
   * Get a unique prop ID for hardware selection.
   */
  getUniquePropID(): number;

  /**
   * Get a prop (actor) by its hardware-selection ID.
   * @param id The prop ID.
   * @returns The matching prop, or `null` if not found.
   */
  getPropFromID(id: number): vtkObject | null;

  /**
   * Read pixels from the current framebuffer asynchronously.
   * Returns an object with `colorValues` (Uint8ClampedArray), `width`, and `height`.
   */
  getPixelsAsync(): Promise<{
    colorValues: Uint8ClampedArray;
    width: number;
    height: number;
  }>;

  /**
   * Create a hardware selector bound to this render window.
   */
  createSelector(): any;

  /**
   * Set the size of the render window.
   * @param width Width in pixels.
   * @param height Height in pixels.
   */
  setSize(width: number, height: number): boolean;

  /**
   * Controls the number of MSAA samples per pixel.
   *
   * - **Default:** `1` (no anti-aliasing)
   *
   * @param count The sample count (`1` or `4`).
   * @returns `true` if the value changed, `false` otherwise.
   */
  setMultiSample(count: 1 | 4): boolean;

  // -------------------------------------------------------------------
  // macro.get (getter-only)
  // -------------------------------------------------------------------

  /**
   * Get the WebGPU command encoder for the current frame.
   */
  getCommandEncoder(): any;

  /**
   * Get whether a background image is being used.
   */
  getUseBackgroundImage(): boolean;

  /**
   * Get whether XR (WebXR) is supported.
   */
  getXrSupported(): boolean;

  /**
   * Get the current MSAA sample count.
   */
  getMultiSample(): 1 | 4;

  // -------------------------------------------------------------------
  // macro.setGet
  // -------------------------------------------------------------------

  /**
   * Get whether the render window has been initialized.
   */
  getInitialized(): boolean;

  /**
   * Set the initialized state.
   * @param initialized Whether initialized.
   */
  setInitialized(initialized: boolean): boolean;

  /**
   * Get the WebGPU canvas context.
   */
  getContext(): any;

  /**
   * Set the WebGPU canvas context.
   * @param context The GPU canvas context.
   */
  setContext(context: any): boolean;

  /**
   * Get the current canvas element.
   */
  getCanvas(): HTMLCanvasElement;

  /**
   * Set the canvas element.
   * @param canvas The canvas element.
   */
  setCanvas(canvas: HTMLCanvasElement): boolean;

  /**
   * Get the WebGPU device wrapper.
   */
  getDevice(): any;

  /**
   * Set the WebGPU device wrapper.
   * @param device The device wrapper instance.
   */
  setDevice(device: any): boolean;

  /**
   * Get the render passes.
   */
  getRenderPasses(): any[];

  /**
   * Set the render passes.
   * @param passes Array of render passes.
   */
  setRenderPasses(passes: any[]): boolean;

  /**
   * Get whether image capture notification is enabled.
   */
  getNotifyStartCaptureImage(): boolean;

  /**
   * Set whether image capture notification is enabled.
   * @param notify Whether to notify on capture start.
   */
  setNotifyStartCaptureImage(notify: boolean): boolean;

  /**
   * Get the current cursor style.
   */
  getCursor(): string;

  /**
   * Set the cursor style.
   * @param cursor CSS cursor value.
   */
  setCursor(cursor: string): boolean;

  /**
   * Get whether off-screen rendering is enabled.
   */
  getUseOffScreen(): boolean;

  /**
   * Set whether to use off-screen rendering.
   * @param useOffScreen Whether to render off-screen.
   */
  setUseOffScreen(useOffScreen: boolean): boolean;

  /**
   * Get the presentation texture format used by the swap chain.
   */
  getPresentationFormat(): string | null;

  // -------------------------------------------------------------------
  // macro.setGetArray
  // -------------------------------------------------------------------

  /**
   * Get the current render window size.
   * @returns [width, height]
   */
  getSize(): [number, number];

  // -------------------------------------------------------------------
  // macro.event
  // -------------------------------------------------------------------

  /**
   * Register a callback for when a captured image is ready.
   * @param callback Called with the image data URL string.
   */
  onImageReady(callback: (imageURL: string) => void): vtkSubscription;

  /**
   * Programmatically fire the imageReady event.
   * @param imageURL The image data URL.
   */
  invokeImageReady(imageURL: string): void;

  /**
   * Register a callback for when the render window has finished initializing.
   * @param callback Called once GPU context creation is complete.
   */
  onInitialized(callback: () => void): vtkSubscription;

  /**
   * Programmatically fire the initialized event.
   */
  invokeInitialized(): void;

  /**
   * Register a callback for window resize events.
   * @param callback Called with `{ width, height }` when the window is resized.
   */
  onWindowResizeEvent(
    callback: (event: { width: number; height: number }) => void
  ): vtkSubscription;

  /**
   * Programmatically fire the windowResizeEvent.
   * @param event The resize event payload.
   */
  invokeWindowResizeEvent(event: { width: number; height: number }): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with
 * vtkWebGPURenderWindow characteristics.
 *
 * @param publicAPI object on which methods will be bound (public)
 * @param model object on which data structure will be bound (protected)
 * @param initialValues (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPURenderWindowInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPURenderWindow.
 * @param initialValues Initial property values.
 */
export function newInstance(
  initialValues?: IWebGPURenderWindowInitialValues
): vtkWebGPURenderWindow;

/**
 * vtkWebGPURenderWindow is designed to view/render a vtkRenderWindow
 * using the WebGPU API.
 */
export declare const vtkWebGPURenderWindow: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPURenderWindow;
