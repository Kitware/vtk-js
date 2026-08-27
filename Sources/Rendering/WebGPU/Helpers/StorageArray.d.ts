/// <reference types="@webgpu/types" />

import { Nullable } from '../../../types';
import { IWebGPUBindable } from '../BindGroup';
import vtkWebGPUBuffer from '../Buffer';

/**
 * A read only storage array whose bind group changes when its buffer changes.
 */
export type WebGPUStorageArray = IWebGPUBindable & {
  getLabel(): string;
  getBuffer(): Nullable<vtkWebGPUBuffer>;
  setBuffer(buffer: Nullable<vtkWebGPUBuffer>): void;
};

/**
 * Create a storage binding read by the shader as array<elementType>.
 */
export function newStorageArray(
  label: string,
  elementType: string
): WebGPUStorageArray;

declare const vtkWebGPUStorageArray: {
  newStorageArray: typeof newStorageArray;
};
export default vtkWebGPUStorageArray;
