/// <reference types="@webgpu/types" />

/**
 * The typed array constructor matching the element type of a texture format.
 */
export type WebGPUNativeArrayConstructor =
  | Int8ArrayConstructor
  | Uint8ArrayConstructor
  | Int16ArrayConstructor
  | Uint16ArrayConstructor
  | Int32ArrayConstructor
  | Uint32ArrayConstructor
  | Float32ArrayConstructor;

/**
 * The sample type of a texture format. `mixed` is used for the combined
 * depth/stencil formats, which have no single WebGPU sample type.
 */
export type WebGPUTextureSampleType = GPUTextureSampleType | 'mixed';

/**
 * Byte layout and sampling information for a WebGPU texture format.
 */
export interface IWebGPUTextureDetails {
  /**
   * The number of components a texel holds.
   */
  numComponents: number;

  /**
   * The typed array constructor able to hold the format's components.
   */
  nativeType: WebGPUNativeArrayConstructor;

  /**
   * The size, in bytes, of one texel.
   */
  stride: number;

  /**
   * The size, in bytes, of one component. Absent for the packed formats,
   * whose components do not have a byte size of their own.
   */
  elementSize?: number;

  /**
   * How a shader samples the format.
   */
  sampleType: WebGPUTextureSampleType;
}

/**
 * Get the byte layout and sampling information of a texture format.
 * Returns 0 when the format is falsy or too short to be a format name, and
 * null when it is not a format vtk.js knows about.
 * @param {GPUTextureFormat} format
 */
declare function getDetailsFromTextureFormat(
  format: GPUTextureFormat
): IWebGPUTextureDetails | null | 0;

/**
 * Get the size, in bytes, of one element of a vertex buffer format.
 * Returns 0 when the format is falsy or too short to be a format name.
 * @param {GPUVertexFormat} format
 */
declare function getByteStrideFromBufferFormat(format: GPUVertexFormat): number;

/**
 * Get the number of components of a vertex buffer format.
 * Returns 0 when the format is falsy or too short to be a format name.
 * @param {GPUVertexFormat} format
 */
declare function getNumberOfComponentsFromBufferFormat(
  format: GPUVertexFormat
): number;

/**
 * Get the name of the typed array able to hold a vertex buffer format, e.g.
 * `Float32Array`. Returns 0 when the format is falsy or too short to be a
 * format name, and undefined when it cannot be parsed.
 * @param {GPUVertexFormat} format
 */
declare function getNativeTypeFromBufferFormat(
  format: GPUVertexFormat
): string | undefined | 0;

/**
 * Get the WGSL type, e.g. `vec4<f32>`, matching a vertex buffer format.
 * Returns undefined when the format cannot be parsed.
 * @param {GPUVertexFormat} format
 */
declare function getShaderTypeFromBufferFormat(
  format: GPUVertexFormat
): string | undefined;

/**
 * Get the size, in bytes, of a WGSL type such as `vec3<f32>` or `mat4x4<f32>`.
 * Returns 0 when the format is falsy.
 * @param {String} format
 */
declare function getByteStrideFromShaderFormat(format: string): number;

/**
 * Get the name of the typed array able to hold a WGSL type, e.g.
 * `Float32Array`. Returns undefined when the type is falsy or unknown.
 * @param {String} format
 */
declare function getNativeTypeFromShaderFormat(
  format: string
): string | undefined;

/**
 * Static helpers translating between the WebGPU buffer, shader and texture
 * format names and the byte sizes, alignments and native arrays vtk.js needs.
 */
declare const vtkWebGPUTypes: {
  getDetailsFromTextureFormat: typeof getDetailsFromTextureFormat;
  getByteStrideFromBufferFormat: typeof getByteStrideFromBufferFormat;
  getNumberOfComponentsFromBufferFormat: typeof getNumberOfComponentsFromBufferFormat;
  getNativeTypeFromBufferFormat: typeof getNativeTypeFromBufferFormat;
  getShaderTypeFromBufferFormat: typeof getShaderTypeFromBufferFormat;
  getByteStrideFromShaderFormat: typeof getByteStrideFromShaderFormat;
  getNativeTypeFromShaderFormat: typeof getNativeTypeFromShaderFormat;
};
export default vtkWebGPUTypes;
