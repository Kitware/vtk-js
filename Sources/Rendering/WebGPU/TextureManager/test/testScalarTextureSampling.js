import { expect, it, onTestFinished } from 'vitest';

import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkWebGPUDevice from 'vtk.js/Sources/Rendering/WebGPU/Device';

/* eslint-disable no-undef, no-bitwise */
it.skipIf(!__VTK_TEST_WEBGPU__).for([false, true])(
  'linearly samples 16 bit image scalars with tier1 enabled %s',
  async (enableTier1, { skip }) => {
    const adapter = await navigator.gpu.requestAdapter();
    expect(adapter).not.toBeNull();
    skip(
      enableTier1 && !adapter.features.has('texture-formats-tier1'),
      'texture-formats-tier1 unavailable'
    );
    const handle = await adapter.requestDevice({
      requiredFeatures: enableTier1 ? ['texture-formats-tier1'] : [],
    });
    onTestFinished(() => handle.destroy());
    const device = vtkWebGPUDevice.newInstance();
    device.initialize(handle);

    const image = vtkImageData.newInstance();
    image.setDimensions(1, 1, 2);
    image.getPointData().setScalars(
      vtkDataArray.newInstance({
        values: new Int16Array([-2048, 1024, 1024, -512]),
        numberOfComponents: 2,
      })
    );
    const texture = device.getTextureManager().getTextureForImageData(image);
    const view = texture.createView('scalars', { dimension: '3d' });
    const sampler = handle.createSampler({
      minFilter: 'linear',
      magFilter: 'linear',
    });

    const pipeline = await handle.createComputePipelineAsync({
      layout: 'auto',
      compute: {
        module: handle.createShaderModule({
          code: `
          @group(0) @binding(0) var image: texture_3d<f32>;
          @group(0) @binding(1) var linearSampler: sampler;
          @group(0) @binding(2) var<storage, read_write> result: vec2f;
          @compute @workgroup_size(1) fn main() {
            result = textureSampleLevel(image, linearSampler, vec3f(0.5), 0).rg;
          }`,
        }),
        entryPoint: 'main',
      },
    });
    const output = handle.createBuffer({
      size: 8,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });
    const readback = handle.createBuffer({
      size: 8,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });
    handle.pushErrorScope('validation');
    const bindings = handle.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: view.getHandle() },
        { binding: 1, resource: sampler },
        { binding: 2, resource: { buffer: output } },
      ],
    });
    const encoder = handle.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindings);
    pass.dispatchWorkgroups(1);
    pass.end();
    encoder.copyBufferToBuffer(output, 0, readback, 0, 8);
    handle.queue.submit([encoder.finish()]);
    expect(await handle.popErrorScope()).toBeNull();

    await readback.mapAsync(GPUMapMode.READ);
    const samples = new Float32Array(readback.getMappedRange());
    expect(Array.from(samples, (value) => value * texture.getScale())).toEqual([
      -512, 256,
    ]);
  }
);
