import { expect, it, onTestFinished } from 'vitest';

import macro from 'vtk.js/Sources/macros';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkWebGPUDevice from 'vtk.js/Sources/Rendering/WebGPU/Device';

/* eslint-disable no-undef, no-bitwise */
async function createDevice(adapter, requiredFeatures = []) {
  const handle = await adapter.requestDevice({ requiredFeatures });
  onTestFinished(() => handle.destroy());
  const device = vtkWebGPUDevice.newInstance();
  device.initialize(handle);
  return device;
}

function createImage(values, numberOfComponents) {
  const image = vtkImageData.newInstance();
  image.setDimensions(1, 1, 2);
  image
    .getPointData()
    .setScalars(vtkDataArray.newInstance({ values, numberOfComponents }));
  return image;
}

// Linearly samples the center of a 3D texture and returns the first two
// components scaled to the source scalar range.
async function sampleCenter(device, texture) {
  const handle = device.getHandle();
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
  return Array.from(
    new Float32Array(readback.getMappedRange()),
    (value) => value * texture.getScale()
  );
}

it.skipIf(!__VTK_TEST_WEBGPU__).for([false, true])(
  'linearly samples 16 bit image scalars with tier1 enabled %s',
  async (enableTier1, { skip }) => {
    const adapter = await navigator.gpu.requestAdapter();
    expect(adapter).not.toBeNull();
    skip(
      enableTier1 && !adapter.features.has('texture-formats-tier1'),
      'texture-formats-tier1 unavailable'
    );
    const device = await createDevice(
      adapter,
      enableTier1 ? ['texture-formats-tier1'] : []
    );

    const image = createImage(new Int16Array([-2048, 1024, 1024, -512]), 2);
    const texture = device.getTextureManager().getTextureForImageData(image);

    expect(await sampleCenter(device, texture)).toEqual([-512, 256]);
  }
);

it.skipIf(!__VTK_TEST_WEBGPU__)(
  'samples Uint16 scalars beyond the half float range as the largest finite half float',
  async () => {
    const adapter = await navigator.gpu.requestAdapter();
    expect(adapter).not.toBeNull();
    const device = await createDevice(adapter);

    const image = createImage(new Uint16Array([65535, 65535]), 1);
    const warnings = [];
    macro.setLoggerFunction('warn', (...args) => warnings.push(args.join(' ')));
    let texture;
    try {
      texture = device
        .getTextureManager()
        .getTextureForImageData(image, { preferSizeOverAccuracy: true });
    } finally {
      macro.setLoggerFunction('warn', console.warn);
    }

    expect(texture.getFormat()).toBe('r16float');
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('65504');
    const [value] = await sampleCenter(device, texture);
    expect(value).toBe(65504);
  }
);
