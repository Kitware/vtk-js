/// <reference types="@webgpu/types" />

import { Nullable } from '../../../types';
import vtkWebGPUBuffer, { IWebGPUBufferInitialValues } from '../Buffer';
import { IWebGPUBufferRequest } from '../BufferManager';
import { BufferUsage, PrimitiveTypes } from '../BufferManager/Constants';

export interface IWebGPUIndexBufferInitialValues extends IWebGPUBufferInitialValues {
  flatIdToPointId?: Nullable<Uint16Array | Uint32Array>;
  flatIdToCellId?: Nullable<Uint16Array | Uint32Array>;
  flatSize?: number;
  indexCount?: number;
  primitiveToCellId?: Nullable<Uint32Array>;
  primitiveToCellIdBuffer?: Nullable<vtkWebGPUBuffer>;
}

export interface vtkWebGPUIndexBuffer extends vtkWebGPUBuffer {
  /**
   * Build the index buffer for the cells of the request. The
   * resulting typed array is stored on the request as `nativeArray` and its
   * WebGPU index format as `format`. When pointIds is true, the indices are
   * point ids and the flat id maps are null. Otherwise, the indices refer to
   * flattened vertices.
   * @param {IWebGPUBufferRequest} req The request, providing cells,
   * numberOfPoints, primitiveType, representation and cellOffset.
   */
  buildIndexBuffer(req: IWebGPUBufferRequest): void;

  /**
   * Build an index buffer of point ids for the primitive-index feature.
   */
  buildPointIdIndexBuffer(req: IWebGPUBufferRequest): void;

  /**
   * Build an index buffer with a separate provoking vertex for each cell.
   */
  buildFlatIndexBuffer(req: IWebGPUBufferRequest): void;

  /**
   * Get the global cell id of each primitive, or null for a one-to-one mapping.
   */
  getPrimitiveToCellId(): Nullable<Uint32Array>;

  setPrimitiveToCellId(primitiveToCellId: Nullable<Uint32Array>): boolean;

  /**
   * Get the storage buffer holding the primitive-to-cell map, when needed.
   */
  getPrimitiveToCellIdBuffer(): Nullable<vtkWebGPUBuffer>;

  setPrimitiveToCellIdBuffer(
    primitiveToCellIdBuffer: Nullable<vtkWebGPUBuffer>
  ): boolean;

  /**
   * Get the map from flat id to the point id it was expanded from.
   */
  getFlatIdToPointId(): Nullable<Uint16Array | Uint32Array>;

  /**
   * Set the map from flat id to the point id it was expanded from.
   */
  setFlatIdToPointId(
    flatIdToPointId: Nullable<Uint16Array | Uint32Array>
  ): boolean;

  /**
   * Get the map from flat id to the cell id it was expanded from.
   */
  getFlatIdToCellId(): Nullable<Uint16Array | Uint32Array>;

  /**
   * Set the map from flat id to the cell id it was expanded from.
   */
  setFlatIdToCellId(
    flatIdToCellId: Nullable<Uint16Array | Uint32Array>
  ): boolean;

  /**
   * Get the number of flat ids, i.e. the number of vertices the attribute
   * buffers must hold.
   */
  getFlatSize(): number;

  /**
   * Set the number of flat ids.
   */
  setFlatSize(flatSize: number): boolean;

  /**
   * Get the number of indices stored in the buffer.
   */
  getIndexCount(): number;

  /**
   * Set the number of indices stored in the buffer.
   */
  setIndexCount(indexCount: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUIndexBuffer characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUIndexBufferInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUIndexBufferInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUIndexBuffer.
 * @param {IWebGPUIndexBufferInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUIndexBufferInitialValues
): vtkWebGPUIndexBuffer;

export declare const vtkWebGPUIndexBuffer: {
  newInstance: typeof newInstance;
  extend: typeof extend;
  BufferUsage: typeof BufferUsage;
  PrimitiveTypes: typeof PrimitiveTypes;
};
export default vtkWebGPUIndexBuffer;
