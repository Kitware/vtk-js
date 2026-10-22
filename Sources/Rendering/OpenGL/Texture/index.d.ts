import { Wrap, Filter } from './Constants';
import vtkOpenGLRenderWindow from '../RenderWindow';
import { Extent, Nullable } from '../../../types';
import { VtkDataTypes } from '../../../Common/Core/DataArray/Constants';
import { vtkViewNode } from '../../../Rendering/SceneGraph/ViewNode';
import { vtkObject, vtkRange } from '../../../interfaces';

/**
 * Initial values for creating a new instance of vtkOpenGLTexture.
 */
export interface ITextureInitialValues {
  _openGLRenderWindow?: Nullable<vtkOpenGLRenderWindow>;
  _forceInternalFormat?: boolean;
  context?: WebGL2RenderingContext;
  handle?: number;
  sendParametersTime?: vtkObject;
  textureBuildTime?: vtkObject;
  numberOfDimensions?: number;
  target?: number;
  format?: number;
  openGLDataType?: number;
  components?: number;
  width?: number;
  height?: number;
  depth?: number;
  autoParameters?: boolean;
  wrapS?: Wrap;
  wrapT?: Wrap;
  wrapR?: Wrap;
  minificationFilter?: Filter;
  magnificationFilter?: Filter;
  minLOD?: number;
  maxLOD?: number;
  baseLevel?: number;
  maxLevel?: number;
  generateMipmap?: boolean;
  useHalfFloat?: boolean;
  oglNorm16Ext?: any;
  allocatedGPUMemoryInBytes?: number;
}

/**
 * Scale and offset needed to map texture values back to data values, as
 * `data = texture * scale + offset`.
 *
 * The dimensions and the data-computed scale/offset are only recorded when the
 * texture is built from a data array.
 */
export interface ITextureVolumeInfo {
  scale: number[];
  offset: number[];
  dataComputedScale?: number[];
  dataComputedOffset?: number[];
  width?: number;
  height?: number;
  depth?: number;
}

/**
 * Scale and shift needed to map normalized OpenGL data type values back to
 * data values, as `data = value * scale + shift`.
 */
export interface ITextureShiftAndScale {
  shift: number;
  scale: number;
}

/**
 * Interface for OpenGL Texture.
 */
export interface vtkOpenGLTexture extends vtkViewNode {
  /**
   * Renders the texture within the given render window.
   * @param renWin The render window in which to render the texture.
   */
  render(renWin: vtkOpenGLRenderWindow): void;

  /**
   * Destroys the texture and frees up any resources it's using.
   */
  destroyTexture(): void;

  /**
   * Creates the texture in the OpenGL context.
   */
  createTexture(): void;

  /**
   * Gets the texture unit number that this texture is bound to.
   * @returns {number} The texture unit number.
   */
  getTextureUnit(): number;

  /**
   * Activates the texture, making it the current texture for subsequent OpenGL operations.
   */
  activate(): void;

  /**
   * Deactivates the texture, making it no longer the current texture for subsequent OpenGL operations.
   */
  deactivate(): void;

  /**
   * Releases the graphics resources used by the texture within the given render window.
   * @param renWin The render window whose resources should be released.
   */
  releaseGraphicsResources(renWin: vtkOpenGLRenderWindow): void;

  /**
   * Binds the texture to the current OpenGL context.
   */
  bind(): void;

  /**
   * Checks if the texture is currently bound to the OpenGL context.
   * @returns {boolean} True if the texture is bound, false otherwise.
   */
  isBound(): boolean;

  /**
   * Sends the texture parameters to the OpenGL context.
   */
  sendParameters(): void;

  /**
   * Gets the internal format for the texture based on the VTK data type and number of components.
   * @param vtktype The VTK data type.
   * @param numComps The number of components in the texture.
   * @returns The internal format.
   */
  getInternalFormat(vtktype: VtkDataTypes, numComps: number): number;

  /**
   * Gets the default internal format for the texture based on the VTK data type and number of components.
   * @param vtktype The VTK data type.
   * @param numComps The number of components in the texture.
   * @returns The default internal format.
   */
  getDefaultInternalFormat(vtktype: VtkDataTypes, numComps: number): number;

  /**
   * Sets the internal format for the texture.
   * @param iformat The internal format to set.
   */
  setInternalFormat(iformat: number): void;

  /**
   * Gets the format for the texture based on the VTK data type and number of components.
   * @param vtktype The VTK data type.
   * @param numComps The number of components in the texture.
   * @returns The format.
   */
  getFormat(vtktype: VtkDataTypes, numComps: number): number;

  /**
   * Gets the default format for the texture based on the VTK data type and number of components.
   * @param vtktype The VTK data type.
   * @param numComps The number of components in the texture.
   * @returns The default format.
   */
  getDefaultFormat(vtktype: VtkDataTypes, numComps: number): number;

  /**
   * Resets the texture format and type to their default values.
   */
  resetFormatAndType(): void;

  /**
   * Gets the default data type for the texture based on the VTK scalar type.
   * @param vtkScalarType The VTK scalar type.
   * @returns The default data type.
   */
  getDefaultDataType(vtkScalarType: VtkDataTypes): number;

  /**
   * Gets the OpenGL data type for the texture based on the VTK scalar type and whether to force an update.
   * @param vtkScalarType The VTK scalar type.
   * @param forceUpdate Whether to force the update of the data type.
   * @returns The OpenGL data type.
   */
  getOpenGLDataType(vtkScalarType: VtkDataTypes, forceUpdate: boolean): number;

  /**
   * Gets the shift and scale values for the texture.
   * @returns The shift and scale values.
   */
  getShiftAndScale(): ITextureShiftAndScale;

  /**
   * Gets the OpenGL filter mode for the texture.
   * @param emode The filter mode.
   * @returns The OpenGL filter mode.
   */
  getOpenGLFilterMode(emode: Filter): number;

  /**
   * Gets the OpenGL wrap mode for the texture.
   * @param vtktype The wrap type.
   * @returns The OpenGL wrap mode.
   */
  getOpenGLWrapMode(vtktype: Wrap): number;

  /**
   * Updates the data array to match the required data type for OpenGL.
   *
   * This function takes the input data and converts it to the appropriate
   * format required by the OpenGL texture, based on the specified data type.
   *
   * @param {string} dataType - The original data type of the input data.
   * @param {Array} data - The input data array that needs to be updated.
   * @param {boolean} [depth=false] - Indicates whether the data is a 3D array.
   * @param {Array<Extent>} imageExtents only consider these image extents (default: [])
   * @returns {Array} The updated data array that matches the OpenGL data type.
   */
  updateArrayDataTypeForGL(
    dataType: VtkDataTypes,
    data: any,
    depth?: boolean,
    imageExtents?: Extent[]
  ): any[];

  /**
   * Creates a 2D texture from raw data.
   * @param width The width of the texture.
   * @param height The height of the texture.
   * @param numComps The number of components in the texture.
   * @param dataType The data type of the texture.
   * @param data The raw data for the texture.
   * @param flip Whether to flip the texture vertically. Defaults to false.
   * @returns {boolean} True if the texture was successfully created, false otherwise.
   */
  create2DFromRaw({
    width,
    height,
    numComps,
    dataType,
    data,
    flip,
  }: {
    width: number;
    height: number;
    numComps: number;
    dataType: VtkDataTypes;
    data: any;
    flip?: boolean;
  }): boolean;

  /**
   * Creates a cube texture from raw data.
   * @param width The width of each face of the cube texture.
   * @param height The height of each face of the cube texture.
   * @param numComps The number of components in the texture.
   * @param dataType The data type of the texture.
   * @param data The raw data for the texture.
   * @returns {boolean} True if the cube texture was successfully created, false otherwise.
   */
  createCubeFromRaw({
    width,
    height,
    numComps,
    dataType,
    data,
  }: {
    width: number;
    height: number;
    numComps: number;
    dataType: VtkDataTypes;
    data: any;
  }): boolean;

  /**
   * Creates a 2D depth texture from raw data.
   * @param width The width of the texture.
   * @param height The height of the texture.
   * @param dataType The data type of the texture.
   * @param data The raw data for the texture.
   * @returns {boolean} True if the texture was successfully created, false otherwise.
   */
  createDepthFromRaw({
    width,
    height,
    dataType,
    data,
  }: {
    width: number;
    height: number;
    dataType: VtkDataTypes;
    data: any;
  }): boolean;

  /**
   * Creates a 2D texture from an image.
   * @param image The image to use for the texture.
   * @returns {boolean} True if the texture was successfully created, false otherwise.
   */
  create2DFromImage(image: HTMLImageElement): boolean;

  /**
   * Creates a 2D texture from an ImageBitmap.
   * @param imageBitmap  The ImageBitmap to use for the texture.
   *  @returns {boolean} True if the texture was successfully created, false otherwise.
   */
  create2DFromImageBitmap(imageBitmap: ImageBitmap): boolean;

  /**
   * Creates a 2D filterable texture from raw data, with a preference for size over accuracy if necessary.
   * @param width The width of the texture.
   * @param height The height of the texture.
   * @param numComps The number of components in the texture.
   * @param dataType The data type of the texture.
   * @param data The raw data for the texture.
   * @param [preferSizeOverAccuracy=false] Whether to prefer texture size over accuracy. Defaults to false.
   * @param [ranges] The precomputed ranges of the data (optional). Provided to prevent computation of the data ranges.
   * @returns {boolean} True if the texture was successfully created, false otherwise.
   */
  create2DFilterableFromRaw({
    width,
    height,
    numComps,
    dataType,
    data,
    preferSizeOverAccuracy,
    ranges,
  }: {
    width: number;
    height: number;
    numComps: number;
    dataType: VtkDataTypes;
    data: any;
    preferSizeOverAccuracy?: boolean;
    ranges?: vtkRange[];
  }): boolean;

  /**
   * Creates a 2D filterable texture from a data array, with a preference for size over accuracy if necessary.
   * @param width The width of the texture.
   * @param height The height of the texture.
   * @param dataArray The data array to use for the texture.
   * @param preferSizeOverAccuracy Whether to prefer texture size over accuracy.
   * @returns {boolean} True if the texture was successfully created, false otherwise.
   */
  create2DFilterableFromDataArray({
    width,
    height,
    dataArray,
    preferSizeOverAccuracy,
  }: {
    width: number;
    height: number;
    dataArray: any;
    preferSizeOverAccuracy?: boolean;
  }): void;

  /**
   * Creates a 3D texture from raw data.
   *
   * `updatedExtents` support assumes WebGL2 3D texture uploads.
   *
   * @param width The width of the texture.
   * @param height The height of the texture.
   * @param depth The depth of the texture.
   * @param numComps The number of components in the texture.
   * @param dataType The data type of the texture.
   * @param data The raw data for the texture.
   * @param updatedExtents Only update the specified extents (default: [])
   * @returns {boolean} True if the texture was successfully created, false otherwise.
   */
  create3DFromRaw({
    width,
    height,
    depth,
    numComps,
    dataType,
    data,
    updatedExtents,
  }: {
    width: number;
    height: number;
    depth: number;
    numComps: number;
    dataType: VtkDataTypes;
    data: any;
    updatedExtents?: Extent[];
  }): boolean;

  /**
   * Creates a 3D filterable texture from raw data, with a preference for size over accuracy if necessary.
   *
   * `updatedExtents` support assumes WebGL2 3D texture uploads.
   *
   * @param width The width of the texture.
   * @param height The height of the texture.
   * @param depth The depth of the texture.
   * @param numComps The number of components in the texture.
   * @param dataType The data type of the texture.
   * @param data The raw data for the texture.
   * @param preferSizeOverAccuracy Whether to prefer texture size over accuracy.
   * @param [ranges] The precomputed ranges of the data (optional). Provided to
   * @param updatedExtents Only update the specified extents (default: [])
   * prevent computation of the data ranges.
   * @returns {boolean} True if the texture was successfully created, false
   * otherwise.
   */
  create3DFilterableFromRaw({
    width,
    height,
    depth,
    numComps,
    dataType,
    data,
    preferSizeOverAccuracy,
    ranges,
    updatedExtents,
  }: {
    width: number;
    height: number;
    depth: number;
    numComps: number;
    dataType: VtkDataTypes;
    data: any;
    preferSizeOverAccuracy?: boolean;
    ranges?: vtkRange[];
    updatedExtents?: Extent[];
  }): boolean;

  /**
   * Creates a 3D filterable texture from a data array, with a preference for size over accuracy if necessary.
   *
   * `updatedExtents` support assumes WebGL2 3D texture uploads.
   *
   * @param width The width of the texture.
   * @param height The height of the texture.
   * @param depth The depth of the texture.
   * @param dataArray The data array to use for the texture.
   * @param preferSizeOverAccuracy Whether to prefer texture size over accuracy.
   * @param updatedExtents Only update the specified extents (default: [])
   * @returns {boolean} True if the texture was successfully created, false otherwise.
   */
  create3DFilterableFromDataArray({
    width,
    height,
    depth,
    dataArray,
    preferSizeOverAccuracy,
  }: {
    width: number;
    height: number;
    depth: number;
    dataArray: any;
    preferSizeOverAccuracy?: boolean;
    updatedExtents?: Extent[];
  }): boolean;

  /**
   * Sets the OpenGL render window in which the texture will be used.
   * @param renWin The render window to set.
   */
  setOpenGLRenderWindow(renWin: any): void;

  /**
   * Gets the maximum texture size supported by the OpenGL context.
   * @param ctx The OpenGL context.
   * @returns {number} The maximum texture size.
   */
  getMaximumTextureSize(ctx: any): number;

  /**
   * Public API to disable half float usage.
   * Half float is automatically enabled when creating the texture,
   * but users may want to disable it in certain cases
   * (e.g., streaming data where the full range is not yet available).
   * @param useHalfFloat - whether to use half float
   */
  enableUseHalfFloat(useHalfFloat: boolean): void;

  /**
   * Whether half float is both enabled and usable for the current data range.
   * @returns {boolean} True when half float is in use.
   */
  useHalfFloat(): boolean;

  /**
   * Recomputes the scale and offset stored in the volume info for the given
   * data type and number of components.
   * @param dataType The VTK data type of the texture data.
   * @param numComps The number of components in the texture.
   * @returns {boolean} True if a scaling was applied for that data type.
   */
  updateVolumeInfoForGL(dataType: VtkDataTypes, numComps: number): boolean;

  /**
   * Gets the scale and offset mapping texture values back to data values.
   */
  getVolumeInfo(): ITextureVolumeInfo;

  /**
   * Gets the width of the texture.
   */
  getWidth(): number;

  /**
   * Gets the height of the texture.
   */
  getHeight(): number;

  /**
   * Gets the number of components of the texture.
   */
  getComponents(): number;

  /**
   * Gets the underlying WebGL texture object, or 0 when no texture is allocated.
   */
  getHandle(): WebGLTexture | number;

  /**
   * Gets the OpenGL texture target.
   */
  getTarget(): number;

  /**
   * Gets the amount of GPU memory allocated for this texture, in bytes.
   */
  getAllocatedGPUMemoryInBytes(): number;

  /**
   * Sets the format for the texture.
   * @param format The format to set.
   */
  setFormat(format: number): boolean;

  /**
   * Sets the OpenGL data type for the texture.
   * @param openGLDataType The OpenGL data type to set.
   */
  setOpenGLDataType(openGLDataType: number): boolean;

  /**
   * Gets the time stamp used to track matrix updates.
   */
  getKeyMatrixTime(): vtkObject;

  /**
   * Sets the time stamp used to track matrix updates.
   * @param keyMatrixTime The time stamp to set.
   */
  setKeyMatrixTime(keyMatrixTime: vtkObject): boolean;

  /**
   * Gets the minification filter.
   */
  getMinificationFilter(): Filter;

  /**
   * Sets the minification filter.
   * @param minificationFilter The filter to set.
   */
  setMinificationFilter(minificationFilter: Filter): boolean;

  /**
   * Gets the magnification filter.
   */
  getMagnificationFilter(): Filter;

  /**
   * Sets the magnification filter.
   * @param magnificationFilter The filter to set.
   */
  setMagnificationFilter(magnificationFilter: Filter): boolean;

  /**
   * Gets the wrap mode along S.
   */
  getWrapS(): Wrap;

  /**
   * Sets the wrap mode along S.
   * @param wrapS The wrap mode to set.
   */
  setWrapS(wrapS: Wrap): boolean;

  /**
   * Gets the wrap mode along T.
   */
  getWrapT(): Wrap;

  /**
   * Sets the wrap mode along T.
   * @param wrapT The wrap mode to set.
   */
  setWrapT(wrapT: Wrap): boolean;

  /**
   * Gets the wrap mode along R.
   */
  getWrapR(): Wrap;

  /**
   * Sets the wrap mode along R.
   * @param wrapR The wrap mode to set.
   */
  setWrapR(wrapR: Wrap): boolean;

  /**
   * Gets whether mipmaps are generated for the texture.
   */
  getGenerateMipmap(): boolean;

  /**
   * Sets whether mipmaps are generated for the texture.
   * @param generateMipmap Whether to generate mipmaps.
   */
  setGenerateMipmap(generateMipmap: boolean): boolean;

  /**
   * Gets the EXT_texture_norm16 extension object, if available.
   */
  getOglNorm16Ext(): Nullable<EXT_texture_norm16>;

  /**
   * Sets the EXT_texture_norm16 extension object.
   * @param oglNorm16Ext The extension object.
   */
  setOglNorm16Ext(oglNorm16Ext: Nullable<EXT_texture_norm16>): boolean;
}

/**
 * Extends the publicAPI with the given model and initial values.
 * @param publicAPI The API to extend.
 * @param model The model to use.
 * @param initialValues The initial values to apply.
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ITextureInitialValues
): void;

/**
 * Creates a new instance of vtkOpenGLTexture with the given initial values.
 * @param initialValues The initial values to use.
 * @returns The new instance.
 */
export function newInstance(
  initialValues?: ITextureInitialValues
): vtkOpenGLTexture;

/**
 * vtkOpenGLTexture static API.
 */
export declare const vtkOpenGLTexture: {
  newInstance: typeof newInstance;
  extend: typeof extend;
  Filter: typeof Filter;
  Wrap: typeof Wrap;
};

export default vtkOpenGLTexture;
