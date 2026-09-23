import macro from 'vtk.js/Sources/macros';

/**
 * Create a bindable for a read only storage buffer that the shader reads as
 * `array<elementType>`. The bind group gets a new entry when setBuffer()
 * changes the buffer.
 * @param {string} label The name of the array in the shader
 * @param {string} elementType The WGSL element type, for example 'u32'
 */
export function newStorageArray(label, elementType) {
  const bindGroupTime = {};
  macro.obj(bindGroupTime, { mtime: 0 });
  let buffer = null;

  return {
    getLabel: () => label,
    getBuffer: () => buffer,
    setBuffer: (newBuffer) => {
      if (newBuffer !== buffer) {
        buffer = newBuffer;
        bindGroupTime.modified();
      }
    },
    getBindGroupTime: () => bindGroupTime,
    getBindGroupLayoutEntry: () => ({
      buffer: { type: 'read-only-storage' },
    }),
    getBindGroupEntry: () => ({
      resource: { buffer: buffer.getHandle() },
    }),
    getShaderCode: (binding, group) =>
      `@binding(${binding}) @group(${group}) var<storage, read> ${label}: array<${elementType}>;`,
  };
}

export default { newStorageArray };
