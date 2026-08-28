import { Nullable } from '../../../types';
import { vtkImageData } from '../../../Common/DataModel/ImageData';
import { vtkPolyData } from '../../../Common/DataModel/PolyData';
import { vtkImageProperty } from '../../Core/ImageProperty';
import {
  IWebGPUImageMapperInitialValues,
  vtkWebGPUImageMapper,
} from '../ImageMapper';
import { vtkWebGPUTexture } from '../Texture';

/**
 * One of the mapper's connected input images and the port it came from.
 */
export interface IWebGPUResliceInput {
  imageData: vtkImageData;
  inputIndex: number;
}

/**
 * An input property asking for a label outline, and the index of that input in
 * the list of valid inputs.
 */
export interface IWebGPUResliceLabelOutlineProperty {
  property: vtkImageProperty;
  arrayIndex: number;
}

/**
 * The scalar texture built for one input, kept until the scalars of that input
 * are modified.
 */
export interface IWebGPUResliceScalarTexture {
  texture: vtkWebGPUTexture;
  mtime: number;
}

export interface IWebGPUImageResliceMapperInitialValues extends IWebGPUImageMapperInitialValues {
  currentValidInputs?: Nullable<IWebGPUResliceInput[]>;
  resliceGeom?: Nullable<vtkPolyData>;
  resliceGeomUpdateString?: Nullable<string>;
  multiTexturePerVolumeEnabled?: boolean;
  numberOfComponents?: number;
  labelOutlineProperties?: IWebGPUResliceLabelOutlineProperty[];
  scalarTextures?: Nullable<IWebGPUResliceScalarTexture>[];
}

export interface vtkWebGPUImageResliceMapper extends vtkWebGPUImageMapper {
  /**
   * Get the per input scalar texture cache. Entries beyond the current number
   * of inputs are cleared to `null`.
   */
  getScalarTextures(): Nullable<IWebGPUResliceScalarTexture>[];

  /**
   * Replace the per input scalar texture cache.
   *
   * @param {IWebGPUResliceScalarTexture[]} [scalarTextures] (default: [])
   */
  setScalarTextures(
    scalarTextures?: Nullable<IWebGPUResliceScalarTexture>[]
  ): void;

  /**
   * Upload the reslice geometry as the index and vertex buffers of this
   * mapper, adding vertex normals when the renderable asks for a slab.
   */
  updateGeometryBuffers(): void;

  /**
   * Rebuild the polydata the image is resliced onto, either the slice plane
   * cut through the image outline or the renderable's own slice polydata.
   */
  updateResliceGeometry(): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUImageResliceMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUImageResliceMapperInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUImageResliceMapperInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUImageResliceMapper.
 * @param {IWebGPUImageResliceMapperInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUImageResliceMapperInitialValues
): vtkWebGPUImageResliceMapper;

/**
 * vtkWebGPUImageResliceMapper is the WebGPU scene graph node that draws a
 * vtkImageSlice whose mapper is a vtkImageResliceMapper. It cuts the slice
 * polydata out of the image outline, textures every connected input onto it
 * and assembles the WGSL that blends them, optionally averaging or projecting
 * over a slab.
 *
 * Importing this module registers it as the WebGPU override for
 * `vtkImageResliceMapper`.
 */
declare const vtkWebGPUImageResliceMapper: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUImageResliceMapper;
