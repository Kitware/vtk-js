/// <reference types="@webgpu/types" />

import { vtkObject } from '../../../interfaces';
import { Nullable } from '../../../types';
import vtkWebGPUBuffer from '../Buffer';
import vtkWebGPUDevice from '../Device';
import vtkWebGPUIndexBuffer from '../IndexBuffer';

/**
 * The vertex state of a render pipeline, as built from the registered buffers.
 */
export interface IWebGPUVertexInputInformation {
  buffers?: GPUVertexBufferLayout[];
}

export interface IWebGPUVertexInputInitialValues {
  created?: boolean;
  device?: vtkWebGPUDevice;
  handle?: unknown;
  indexBuffer?: vtkWebGPUIndexBuffer;
}

export interface vtkWebGPUVertexInput extends vtkObject {
  /**
   * Register a vertex buffer under one or more attribute names. Registering a
   * new set of names keeps the inputs sorted alphabetically, as the shader
   * locations depend on that order.
   * @param buffer The vertex buffer.
   * @param inames The attribute name or names the buffer provides.
   * @param {String} [stepMode] (default: 'vertex')
   */
  addBuffer(
    buffer: vtkWebGPUBuffer,
    inames: string | string[],
    stepMode?: GPUVertexStepMode
  ): void;

  /**
   * Remove the buffer providing the given attribute name, if there is one.
   * @param name The attribute name.
   */
  removeBufferIfPresent(name: string): void;

  /**
   * Get the buffer providing the given attribute name.
   * @param name The attribute name.
   */
  getBuffer(name: string): Nullable<vtkWebGPUBuffer>;

  /**
   * Check whether an attribute of the given name is registered.
   * @param name The attribute name.
   */
  hasAttribute(name: string): boolean;

  /**
   * Get the source time of the buffer providing the given attribute, or zero
   * when the attribute is not registered.
   * @param name The attribute name.
   */
  getAttributeTime(name: string): number;

  /**
   * Get the WGSL declaration of the vertex shader inputs.
   */
  getShaderCode(): string;

  /**
   * Get the vertex buffer layouts of the render pipeline.
   */
  getVertexInputInformation(): IWebGPUVertexInputInformation;

  /**
   * Bind the vertex buffers, and the index buffer when there is one, on the
   * given render encoder.
   * @param renderEncoder The vtkWebGPURenderEncoder to bind onto.
   */
  bindBuffers(renderEncoder: any): void;

  getReady(): void;

  /**
   * Drop the registered buffers when this vertex input was created.
   */
  releaseGraphicsResources(): void;

  /**
   * Get whether the vertex input was created.
   */
  getCreated(): boolean;

  /**
   * Set whether the vertex input was created.
   */
  setCreated(created: boolean): boolean;

  /**
   * Get the device this vertex input belongs to.
   */
  getDevice(): Nullable<vtkWebGPUDevice>;

  /**
   * Set the device this vertex input belongs to.
   */
  setDevice(device: vtkWebGPUDevice): boolean;

  getHandle(): unknown;

  setHandle(handle: unknown): boolean;

  /**
   * Get the index buffer bound along with the vertex buffers.
   */
  getIndexBuffer(): Nullable<vtkWebGPUIndexBuffer>;

  /**
   * Set the index buffer bound along with the vertex buffers.
   */
  setIndexBuffer(indexBuffer: vtkWebGPUIndexBuffer): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUVertexInput characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUVertexInputInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUVertexInputInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUVertexInput.
 * @param {IWebGPUVertexInputInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUVertexInputInitialValues
): vtkWebGPUVertexInput;

export declare const vtkWebGPUVertexInput: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUVertexInput;
