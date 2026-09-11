import macro from 'vtk.js/Sources/macros';

const { vtkErrorMacro, vtkWarningMacro } = macro;

function hasRequiredLimits(requiredLimits, supportedLimits, target) {
  let supported = true;
  Object.entries(requiredLimits).forEach(([name, required]) => {
    const available = supportedLimits?.[name];
    if (typeof available !== 'number' || available < required) {
      vtkWarningMacro(
        `WebGPU ${target} limit "${name}" is ${available ?? 'unavailable'}, ` +
          `but vtk.js requested ${required}.`
      );
      supported = false;
    }
  });
  return supported;
}

// ----------------------------------------------------------------------------
// vtkWebGPUConfiguration methods
// ----------------------------------------------------------------------------

/**
 * vtkWebGPUConfiguration owns the WebGPU adapter and the device, independently
 * of a canvas or a render window.
 *
 * Feature and limit negotiation occurs in one place, as in the C++ class of
 * the same name. An application that wants more than one render window on one
 * device creates a configuration, then gives it to each render window with
 * `setWebGPUConfiguration()`. Those render windows share one device, and thus
 * one set of VTK.js resource caches.
 *
 * A render window that receives no configuration creates one for itself. An
 * application that shows only one view can thus ignore this class.
 *
 */
function vtkWebGPUConfiguration(publicAPI, model) {
  model.classHierarchy.push('vtkWebGPUConfiguration');

  /**
   * Drop a lost device so that the next initialize() requests a new adapter
   * and device. A lost adapter cannot create a replacement device, therefore
   * both references go away together.
   */
  function watchDeviceLoss(device) {
    device.lost?.then(() => {
      if (model.device !== device) {
        return;
      }
      model.device = null;
      model.adapter = null;
      model.deviceReady = false;
      publicAPI.modified();
    });
  }

  function watchUncapturedErrors(device) {
    device.addEventListener?.('uncapturederror', (event) => {
      const error = event.error;
      vtkErrorMacro(
        `WebGPU uncaptured error: ${error?.message || String(error)}`
      );
    });
  }

  publicAPI.initialize = async () => {
    if (model.deviceReady) {
      return true;
    }
    if (model.initializationPromise) {
      return model.initializationPromise;
    }

    const initializationGeneration = model.initializationGeneration;
    const initializationPromise = (async () => {
      if (!navigator.gpu) {
        vtkErrorMacro('WebGPU is not enabled.');
        return false;
      }

      try {
        const adapter = await navigator.gpu.requestAdapter({
          powerPreference: model.powerPreference,
        });
        if (!adapter) {
          vtkErrorMacro('Failed to acquire a WebGPU adapter.');
          return false;
        }
        // Exact storage of 16 bit integers uses r32float. Request filter
        // support when the adapter offers it, as vtkWebGPUConfiguration does
        // for implementation-supported features.
        const requiredFeatures = (model.optionalFeatures || []).filter(
          (feature) => adapter.features.has(feature)
        );
        const requiredLimits = model.requiredLimits || {
          maxBufferSize: adapter.limits.maxBufferSize,
          maxStorageBufferBindingSize:
            adapter.limits.maxStorageBufferBindingSize,
          maxUniformBufferBindingSize:
            adapter.limits.maxUniformBufferBindingSize,
        };
        if (!hasRequiredLimits(requiredLimits, adapter.limits, 'adapter')) {
          return false;
        }
        const device = await adapter.requestDevice({
          requiredFeatures,
          requiredLimits,
        });
        if (!device) {
          vtkErrorMacro('Failed to acquire a WebGPU device.');
          return false;
        }
        if (!hasRequiredLimits(requiredLimits, device.limits, 'device')) {
          device.destroy();
          return false;
        }

        // finalize() may have run while either WebGPU request was pending.
        // Do not resurrect that configuration; explicitly release the device
        // that this now-stale initialization acquired.
        if (model.initializationGeneration !== initializationGeneration) {
          device.destroy();
          return false;
        }

        model.adapter = adapter;
        model.device = device;
        model.deviceReady = true;
        watchDeviceLoss(device);
        watchUncapturedErrors(device);
        return true;
      } catch (error) {
        vtkErrorMacro(
          `WebGPU device creation failed: ${error?.message || String(error)}`
        );
        return false;
      }
    })();
    model.initializationPromise = initializationPromise;

    try {
      return await initializationPromise;
    } finally {
      if (model.initializationPromise === initializationPromise) {
        model.initializationPromise = null;
      }
    }
  };

  publicAPI.isInitialized = () => model.deviceReady;

  publicAPI.hasFeature = (feature) => !!model.device?.features?.has(feature);

  publicAPI.getFeature = (feature) => publicAPI.hasFeature(feature);

  publicAPI.finalize = () => {
    model.initializationGeneration += 1;
    model.initializationPromise = null;
    // A GPUDevice retains its child resources. destroy() asks the browser
    // to release them now instead of waiting for JavaScript GC.
    model.device?.destroy?.();
    model.device = null;
    model.adapter = null;
    model.deviceReady = false;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------
const DEFAULT_VALUES = {
  adapter: null,
  device: null,
  deviceReady: false,
  initializationPromise: null,
  initializationGeneration: 0,
  powerPreference: 'high-performance',
  requiredLimits: undefined,
  optionalFeatures: ['float32-filterable'],
};

// ----------------------------------------------------------------------------
export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['adapter', 'device', 'deviceReady']);
  macro.setGet(publicAPI, model, [
    'powerPreference',
    'requiredLimits',
    'optionalFeatures',
  ]);

  vtkWebGPUConfiguration(publicAPI, model);
}

// ----------------------------------------------------------------------------
export const newInstance = macro.newInstance(extend, 'vtkWebGPUConfiguration');

// ----------------------------------------------------------------------------
export default {
  newInstance,
  extend,
};
