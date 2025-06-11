import { vtkAlgorithm } from '../../../interfaces';
import { Nullable } from '../../../types';

/**
 *
 * @param {boolean} [resizable] Must be set to true if texture can be resized at run time (default: false)
 */
export interface ITextureInitialValues {
  repeat?: boolean;
  interpolate?: boolean;
  edgeClamp?: boolean;
  imageLoaded?: boolean;
  mipLevel?: number;
  resizable?: boolean;
}

export interface vtkTexture extends vtkAlgorithm {
  /**
   * Returns the canvas used by the texture.
   */
  getCanvas(): Nullable<HTMLCanvasElement>;

  /**
   * Returns true if the texture is set to repeat at the edges.
   */
  getRepeat(): boolean;

  /**
   * Returns true if the texture is set to clamp at the edges.
   */
  getEdgeClamp(): boolean;

  /**
   * Returns true if the texture is set to interpolate between texels.
   */
  getInterpolate(): boolean;

  /**
   * Returns the image used by the texture.
   */
  getImage(): Nullable<HTMLImageElement>;

  /**
   * Returns an ImageBitmap object.
   */
  getImageBitmap(): Nullable<ImageBitmap>;

  /**
   * Returns true if the image is loaded.
   */
  getImageLoaded(): boolean;

  /**
   * Returns the input image data object.
   */
  getInputAsJsImageData(): Nullable<
    ImageData | ImageBitmap | HTMLCanvasElement | HTMLImageElement
  >;

  /**
   * Returns the current mip level of the texture.
   */
  getMipLevel(): number;

  /**
   * Returns true if the texture can be resized at run time.
   * This is useful for dynamic textures that may change size based on user
   * interaction or other factors.
   */
  getResizable(): boolean;

  /**
   * Returns the canvas used by the texture.
   */
  setCanvas(canvas: HTMLCanvasElement): void;

  /**
   * Sets the texture to clamp at the edges.
   * @param edgeClamp
   * @default false
   */
  setEdgeClamp(edgeClamp: boolean): boolean;

  /**
   * Sets the texture to interpolate between texels.
   * @param interpolate
   * @default false
   */
  setInterpolate(interpolate: boolean): boolean;

  /**
   * Sets the image used by the texture.
   * @param image
   * @default null
   */
  setImage(image: HTMLImageElement): void;

  /**
   * Sets the image as an ImageBitmap object.
   * Supported in WebGPU only.
   * @param imageBitmap
   */
  setImageBitmap(imageBitmap: ImageBitmap): void;

  /**
   * Sets the input image data as a JavaScript ImageData object.
   * @param imageData
   */
  setJsImageData(imageData: ImageData): void;

  /**
   * Sets the current mip level of the texture.
   * @param level
   */
  setMipLevel(level: number): boolean;

  /**
   * Sets the texture to repeat at the edges.
   * @param repeat
   * @default false
   */
  setRepeat(repeat: boolean): boolean;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkTexture characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ITextureInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ITextureInitialValues
): void;

/**
 * Method use to create a new instance of vtkTexture.
 * @param {ITextureInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: ITextureInitialValues): vtkTexture;

/**
 * Generates mipmaps for a given GPU texture using a compute shader.
 *
 * This function iteratively generates each mip level for the provided texture,
 * using a bilinear downsampling compute shader implemented in WGSL. It creates
 * the necessary pipeline, bind groups, and dispatches compute passes for each
 * mip level.
 *
 * @param {GPUDevice} device - The WebGPU device used to create resources and submit commands.
 * @param {GPUTexture} texture - The GPU texture for which mipmaps will be generated.
 * @param {number} mipLevelCount - The total number of mip levels to generate (including the base level).
 */
export function generateMipmaps(
  device: any,
  texture: any,
  mipLevelCount: number
): Array<Uint8ClampedArray>;

/**
 * vtkTexture is an image algorithm that handles loading and binding of texture
 * maps. It obtains its data from an input image data dataset type. Thus you can
 * create visualization pipelines to read, process, and construct textures. Note
 * that textures will only work if texture coordinates are also defined, and if
 * the rendering system supports texture.
 *
 * This class is used in both WebGL and WebGPU rendering backends, but the
 * implementation details may vary. In WebGL, it uses HTMLImageElement and
 * HTMLCanvasElement for textures, while in WebGPU, it uses HTMLImageElement,
 * HTMLCanvasElement, and ImageBitmap.
 */
export declare const vtkTexture: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkTexture;
