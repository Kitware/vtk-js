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

  publicAPI.initialize = async () => {
    if (model.deviceReady) {
      return true;
    }
    if (model.initializationPromise) {
      return model.initializationPromise;
    }

    model.initializationPromise = (async () => {
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
        model.adapter = adapter;

        // Exact storage of 16 bit integers uses r32float. Request filter
        // support when the adapter offers it, as vtkWebGPUConfiguration does
        // for implementation-supported features.
        const optionalFeatures = ['float32-filterable'];
        const requiredFeatures = optionalFeatures.filter((feature) =>
          adapter.features.has(feature)
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
          return false;
        }

        model.device = device;
        model.deviceReady = true;
        watchDeviceLoss(device);
        return true;
      } catch (error) {
        vtkErrorMacro(`WebGPU device creation failed: ${error.message}`);
        return false;
      }
    })();

    try {
      return await model.initializationPromise;
    } finally {
      model.initializationPromise = null;
    }
  };

  publicAPI.isInitialized = () => model.deviceReady;

  publicAPI.finalize = () => {
    model.initializationPromise = null;
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
  powerPreference: 'high-performance',
  requiredLimits: null,
};

// ----------------------------------------------------------------------------
export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['adapter', 'device', 'deviceReady']);
  macro.setGet(publicAPI, model, ['powerPreference', 'requiredLimits']);

  vtkWebGPUConfiguration(publicAPI, model);
}

// ----------------------------------------------------------------------------
export const newInstance = macro.newInstance(extend, 'vtkWebGPUConfiguration');

// ----------------------------------------------------------------------------
export default {
  newInstance,
  extend,
};
