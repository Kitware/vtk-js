import { afterEach, describe, expect, it, vi } from 'vitest';

import vtkWebGPUConfiguration from 'vtk.js/Sources/Rendering/WebGPU/Configuration';

const limits = {
  maxBufferSize: 1024,
  maxStorageBufferBindingSize: 1024,
  maxUniformBufferBindingSize: 1024,
};
let originalGPU;

function installGPU(adapter) {
  originalGPU = Object.getOwnPropertyDescriptor(navigator, 'gpu');
  Object.defineProperty(navigator, 'gpu', {
    configurable: true,
    value: { requestAdapter: vi.fn(async () => adapter) },
  });
}

function restoreGPU() {
  if (originalGPU) {
    Object.defineProperty(navigator, 'gpu', originalGPU);
  } else {
    delete navigator.gpu;
  }
  originalGPU = undefined;
}

function createDevice(features = []) {
  return {
    addEventListener: vi.fn(),
    destroy: vi.fn(),
    features: new Set(features),
    limits,
    lost: new Promise(() => {}),
  };
}

describe('vtkWebGPUConfiguration', () => {
  afterEach(restoreGPU);

  it('configures available optional features and destroys the owned device', async () => {
    const device = createDevice(['feature-a']);
    const adapter = {
      features: new Set(['feature-a']),
      limits,
      requestDevice: vi.fn(async () => device),
    };
    installGPU(adapter);

    const configuration = vtkWebGPUConfiguration.newInstance({
      optionalFeatures: ['feature-a'],
    });

    expect(await configuration.initialize()).toBe(true);
    expect(adapter.requestDevice).toHaveBeenCalledWith(
      expect.objectContaining({ requiredFeatures: ['feature-a'] })
    );
    expect(configuration.hasFeature('feature-a')).toBe(true);
    expect(configuration.getFeature('feature-a')).toBe(true);
    expect(device.addEventListener).toHaveBeenCalledWith(
      'uncapturederror',
      expect.any(Function)
    );

    configuration.finalize();
    expect(device.destroy).toHaveBeenCalledOnce();
    configuration.delete();
  });

  it('destroys a device acquired after finalize while initialization is in flight', async () => {
    let resolveDevice;
    const devicePromise = new Promise((resolve) => {
      resolveDevice = resolve;
    });
    const adapter = {
      features: new Set(),
      limits,
      requestDevice: vi.fn(() => devicePromise),
    };
    installGPU(adapter);

    const configuration = vtkWebGPUConfiguration.newInstance();
    const initialization = configuration.initialize();
    await vi.waitFor(() => expect(adapter.requestDevice).toHaveBeenCalled());

    configuration.finalize();
    const device = createDevice();
    resolveDevice(device);

    expect(await initialization).toBe(false);
    expect(device.destroy).toHaveBeenCalledOnce();
    expect(configuration.isInitialized()).toBe(false);
    configuration.delete();
  });

  it.each([
    [
      ['float32-filterable', 'primitive-index'],
      ['float32-filterable', 'primitive-index'],
    ],
    [['float32-filterable'], ['float32-filterable']],
  ])(
    'requests primitive-index only when the adapter has it (%j)',
    async (adapterFeatures, requested) => {
      const adapter = {
        features: new Set(adapterFeatures),
        limits,
        requestDevice: vi.fn(async () => createDevice(adapterFeatures)),
      };
      installGPU(adapter);

      const configuration = vtkWebGPUConfiguration.newInstance();
      expect(await configuration.initialize()).toBe(true);
      expect(adapter.requestDevice).toHaveBeenCalledWith(
        expect.objectContaining({ requiredFeatures: requested })
      );
      configuration.finalize();
      configuration.delete();
    }
  );
});
