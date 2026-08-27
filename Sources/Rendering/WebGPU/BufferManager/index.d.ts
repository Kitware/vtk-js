/// <reference types="@webgpu/types" />

import { vtkObject } from '../../../interfaces';
import { Nullable, TypedArray } from '../../../types';
import vtkCellArray from '../../../Common/Core/CellArray';
import vtkDataArray from '../../../Common/Core/DataArray';
import { Representation } from '../../Core/Property/Constants';
import vtkWebGPUBuffer from '../Buffer';
import vtkWebGPUDevice from '../Device';
import vtkWebGPUIndexBuffer from '../IndexBuffer';
import { BufferUsage, PrimitiveTypes } from './Constants';

/**
 * Description of a buffer to create or look up in the device object cache.
 * Which fields are required depends on the requested usage.
 */
export interface IWebGPUBufferRequest {
  /**
   * When set, the created buffer is cached on the device under this hash.
   */
  hash?: string;
  usage: BufferUsage;
  label?: string;
  /**
   * Modified time of the data the buffer is built from, stored as the
   * buffer source time.
   */
  time?: number;
  /**
   * WebGPU format string, e.g. 'float32x3' or 'uint16'.
   */
  format?: string;
  interpolation?: string;
  nativeArray?: TypedArray;
  dataArray?: vtkDataArray;
  indexBuffer?: vtkWebGPUIndexBuffer;
  cells?: vtkCellArray;
  numberOfPoints?: number;
  primitiveType?: PrimitiveTypes;
  representation?: Representation;
  cellData?: boolean;
  cellOffset?: number;
  packExtra?: boolean;
  shift?: number | number[];
  scale?: number | number[];
}

export interface IWebGPUBufferManagerInitialValues {
  device?: vtkWebGPUDevice;
  fullScreenQuadBuffer?: vtkWebGPUBuffer;
}

export interface vtkWebGPUBufferManager extends vtkObject {
  /**
   * Get the buffer cached on the device under the given hash, if any.
   * @param hash The buffer hash.
   */
  hasBuffer(hash: string): unknown;

  /**
   * Get or create the buffer described by the request. When the request has a
   * hash, the buffer is looked up in and stored into the device object cache.
   * @param {IWebGPUBufferRequest} req The buffer request.
   */
  getBuffer(req: IWebGPUBufferRequest): vtkWebGPUBuffer;

  /**
   * Get or create a vertex buffer holding the point data of the given array,
   * expanded through the flat ids of the index buffer.
   * @param dataArray The point data array.
   * @param indexBuffer The index buffer providing the flat id mapping.
   */
  getBufferForPointArray(
    dataArray: vtkDataArray,
    indexBuffer: vtkWebGPUIndexBuffer
  ): vtkWebGPUBuffer;

  /**
   * Get or create a vertex buffer holding the cell data of the given array,
   * expanded through the flat ids of the index buffer.
   * @param dataArray The cell data array.
   * @param indexBuffer The index buffer providing the flat id mapping.
   * @param {Number} [cellOffset] (default: 0)
   */
  getBufferForCellArray(
    dataArray: vtkDataArray,
    indexBuffer: vtkWebGPUIndexBuffer,
    cellOffset?: number
  ): vtkWebGPUBuffer;

  /**
   * Get the shared six vertex buffer covering the whole screen.
   */
  getFullScreenQuadBuffer(): vtkWebGPUBuffer;

  /**
   * Get the device the created buffers belong to.
   */
  getDevice(): Nullable<vtkWebGPUDevice>;

  /**
   * Set the device the created buffers belong to.
   */
  setDevice(device: vtkWebGPUDevice): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUBufferManager characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUBufferManagerInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUBufferManagerInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUBufferManager.
 * @param {IWebGPUBufferManagerInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUBufferManagerInitialValues
): vtkWebGPUBufferManager;

export declare const STATIC: Readonly<Record<never, never>>;

export declare const vtkWebGPUBufferManager: {
  newInstance: typeof newInstance;
  extend: typeof extend;
  BufferUsage: typeof BufferUsage;
  PrimitiveTypes: typeof PrimitiveTypes;
};
export default vtkWebGPUBufferManager;
