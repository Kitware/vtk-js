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
   * Returns true if the texture is a cube map.
   * @default false
   */
  getCubeMap(): boolean;

  /**
   * Set if the texture is a cube map. A cube map needs image data on each of
   * the six input ports, one for each face, in the sequence
   * +X, -X, +Y, -Y, +Z, -Z.
   * @param {Boolean} cubeMap
   */
  setCubeMap(cubeMap: boolean): boolean;

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

  /**
   * Get the wrap mode of the R (third) texture coordinate.
   * null uses the wrap mode of the S coordinate. WebGPU only.
   * @default null
   */
  getWrapR(): Nullable<string>;

  /**
   * Set the wrap mode of the R (third) texture coordinate:
   * 'repeat', 'clamp-to-edge' or 'mirror-repeat'. WebGPU only.
   * @param {String} wrapR
   */
  setWrapR(wrapR: Nullable<string>): boolean;

  /**
   * Get the minification filter. null uses the interpolate flag.
   * @default null
   */
  getMinFilter(): Nullable<string>;

  /**
   * Set the minification filter: 'nearest' or 'linear'. WebGPU only.
   * @param {String} minFilter
   */
  setMinFilter(minFilter: Nullable<string>): boolean;

  /**
   * Get the magnification filter. null uses the interpolate flag.
   * @default null
   */
  getMagFilter(): Nullable<string>;

  /**
   * Set the magnification filter: 'nearest' or 'linear'. WebGPU only.
   * @param {String} magFilter
   */
  setMagFilter(magFilter: Nullable<string>): boolean;

  /**
   * Get the filter between mip levels. null gives 'linear'.
   * @default null
   */
  getMipmapFilter(): Nullable<string>;

  /**
   * Set the filter between mip levels: 'nearest' or 'linear'. WebGPU only.
   * @param {String} mipmapFilter
   */
  setMipmapFilter(mipmapFilter: Nullable<string>): boolean;

  /**
   * Get the lowest mip level that the sampler uses. null gives 0.
   * @default null
   */
  getMinLOD(): Nullable<number>;

  /**
   * Set the lowest mip level that the sampler uses. WebGPU only.
   * @param {Number} minLOD
   */
  setMinLOD(minLOD: Nullable<number>): boolean;

  /**
   * Get the highest mip level that the sampler uses. null gives the last level.
   * @default null
   */
  getMaxLOD(): Nullable<number>;

  /**
   * Set the highest mip level that the sampler uses. WebGPU only.
   * @param {Number} maxLOD
   */
  setMaxLOD(maxLOD: Nullable<number>): boolean;

  /**
   * Get the maximum anisotropy of the sampler.
   * @default 1
   */
  getMaxAnisotropy(): number;

  /**
   * Set the maximum anisotropy of the sampler, from 1 to 16. A value larger
   * than 1 needs linear min, mag and mipmap filters. WebGPU only.
   * @param {Number} maxAnisotropy
   */
  setMaxAnisotropy(maxAnisotropy: number): boolean;
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
 * Generates the mip levels of a 2D GPU texture from its level 0.
 *
 * Each level is a render pass that writes the bilinear mix of the level
 * above. Each array layer (for example each cube map face) gets its own mip
 * chain. The texture needs the RENDER_ATTACHMENT and TEXTURE_BINDING usages
 * and a format that canGenerateMipmaps accepts.
 *
 * @param {GPUDevice} device - The WebGPU device used to create resources and submit commands.
 * @param {GPUTexture} texture - The GPU texture for which mipmaps will be generated.
 * @param {number} mipLevelCount - The total number of mip levels to generate (including the base level).
 */
export function generateMipmaps(
  device: any,
  texture: any,
  mipLevelCount: number
): void;

/**
 * Return true when generateMipmaps can make the mip levels of a texture
 * with this WebGPU format.
 *
 * @param {String} format
 */
export function canGenerateMipmaps(format: string): boolean;

/**
 * Return true when a render backend must upload the texture as a cube map.
 * This is true when the cubeMap flag is set and the six input ports have
 * image data with scalars. Six faces without the cubeMap flag also give a
 * cube map, with a warning one time for each texture.
 *
 * @param {vtkTexture} texture
 */
export function useCubeMap(texture: vtkTexture): boolean;

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
  generateMipmaps: typeof generateMipmaps;
  canGenerateMipmaps: typeof canGenerateMipmaps;
  useCubeMap: typeof useCubeMap;
};
export default vtkTexture;
