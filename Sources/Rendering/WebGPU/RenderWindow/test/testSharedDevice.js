import { expect, it } from 'vitest';

import vtkWebGPUConfiguration from 'vtk.js/Sources/Rendering/WebGPU/Configuration';
import vtkWebGPURenderWindow from 'vtk.js/Sources/Rendering/WebGPU/RenderWindow';

it.skipIf(!__VTK_TEST_WEBGPU__)(
  'releasing one window preserves a shared device until configuration finalization',
  async () => {
    const configuration = vtkWebGPUConfiguration.newInstance();
    const firstWindow = vtkWebGPURenderWindow.newInstance({
      webGPUConfiguration: configuration,
    });
    const secondWindow = vtkWebGPURenderWindow.newInstance({
      webGPUConfiguration: configuration,
    });

    try {
      // Some browsers expose navigator.gpu but do not provide an adapter to
      // headless tests. This remains a WebGPU integration test when one is
      // available without turning those environments into failures.
      if (!(await configuration.initialize())) {
        return;
      }
      expect(await firstWindow.create3DContextAsync()).toBe(true);
      expect(await secondWindow.create3DContextAsync()).toBe(true);

      const nativeDevice = configuration.getDevice();
      expect(firstWindow.getDevice()).toBe(secondWindow.getDevice());

      firstWindow.releaseGraphicsResources();
      expect(configuration.isInitialized()).toBe(true);
      expect(secondWindow.getDevice().getHandle()).toBe(nativeDevice);

      const deviceLost = new Promise((resolve) => {
        secondWindow.onDeviceLost(resolve);
      });
      nativeDevice.destroy();
      const info = await deviceLost;

      expect(info.reason).toBe('destroyed');
      expect(configuration.isInitialized()).toBe(false);
    } finally {
      firstWindow.releaseGraphicsResources();
      secondWindow.releaseGraphicsResources();
      firstWindow.delete();
      secondWindow.delete();
      configuration.finalize();
      configuration.delete();
    }
  }
);
