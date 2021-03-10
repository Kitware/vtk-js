import * as macro from 'vtk.js/Sources/macro';
// import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';

// ----------------------------------------------------------------------------
// vtkWebGPURenderPass methods
// ----------------------------------------------------------------------------
function vtkWebGPURenderPass(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPURenderPass');
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------
const DEFAULT_VALUES = {
  description: null,
};

// ----------------------------------------------------------------------------
export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  model.description = {
    colorAttachments: [
      {
        attachment: undefined,
        loadValue: [0.3, 0.3, 0.3, 1],
      },
    ],
    depthStencilAttachment: {
      attachment: undefined,
      depthLoadValue: 1.0,
      depthStoreOp: 'store',
      stencilLoadValue: 0,
      stencilStoreOp: 'store',
    },
  };
  macro.setGet(publicAPI, model, ['description']);

  // For more macro methods, see "Sources/macro.js"
  // Object specific methods
  vtkWebGPURenderPass(publicAPI, model);
}

// ----------------------------------------------------------------------------
export const newInstance = macro.newInstance(extend, 'vtkWebGPURenderPass');

// ----------------------------------------------------------------------------
export default { newInstance, extend };
