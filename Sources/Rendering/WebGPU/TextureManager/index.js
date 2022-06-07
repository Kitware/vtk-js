import macro from 'vtk.js/Sources/macros';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkWebGPUTexture from 'vtk.js/Sources/Rendering/WebGPU/Texture';

const { VtkDataTypes } = vtkDataArray;

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// vtkWebGPUTextureManager methods
// ----------------------------------------------------------------------------

function vtkWebGPUTextureManager(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUTextureManager');

  // fills in request values based on what is missing/provided
  function _fillRequest(req) {
    // fill in values based on imageData if the request has it
    if (req.imageData) {
      req.dataArray = req.imageData.getPointData().getScalars();
      req.time = req.dataArray.getMTime();
      req.nativeArray = req.dataArray.getData();
      const dims = req.imageData.getDimensions();
      req.width = dims[0];
      req.height = dims[1];
      req.depth = dims[2];
      const numComp = req.dataArray.getNumberOfComponents();
      // todo fix handling of 3 component
      switch (numComp) {
        case 1:
          req.format = 'r';
          break;
        case 2:
          req.format = 'rg';
          break;
        case 3:
        case 4:
        default:
          req.format = 'rgba';
          break;
      }

      const dataType = req.dataArray.getDataType();
      switch (dataType) {
        case VtkDataTypes.UNSIGNED_CHAR:
          req.format += '8unorm';
          break;
        // todo extend to other types that are not filterable
        // as they can be useful
        case VtkDataTypes.FLOAT:
        case VtkDataTypes.UNSIGNED_INT:
        case VtkDataTypes.INT:
        case VtkDataTypes.DOUBLE:
        case VtkDataTypes.UNSIGNED_SHORT:
        case VtkDataTypes.SHORT:
        default:
          req.format += '16float';
          break;
      }
    }

    // fill in values based on image if the request has it
    if (req.image) {
      req.width = req.image.width;
      req.height = req.image.height;
      req.depth = 1;
      req.format = 'rgba8unorm';
    }

    // fill in based on js imageData
    if (req.jsImageData) {
      req.width = req.jsImageData.width;
      req.height = req.jsImageData.height;
      req.depth = 1;
      req.format = 'rgba8unorm';
      req.flip = true;
      req.nativeArray = req.jsImageData.data;
    }

    if (req.canvas) {
      req.width = req.canvas.width;
      req.height = req.canvas.height;
      req.depth = 1;
      req.format = 'rgba8unorm';
      req.flip = true;
      /* eslint-disable no-undef */
      /* eslint-disable no-bitwise */
      req.usage =
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT;
      /* eslint-enable no-undef */
      /* eslint-enable no-bitwise */
    }
  }

  // create a texture (used by getTexture)
  function _createTexture(req) {
    const newTex = vtkWebGPUTexture.newInstance();

    newTex.create(model.device, {
      width: req.width,
      height: req.height,
      depth: req.depth,
      format: req.format,
      usage: req.usage,
    });

    // fill the texture if we have data
    if (req.nativeArray || req.image || req.canvas) {
      newTex.writeImageData(req);
    }
    return newTex;
  }

  // get a texture or create it if not cached.
  // this is the main entry point
  publicAPI.getTexture = (req) => {
    // if we have a source the get/create/cache the texture
    if (req.hash) {
      // if a matching texture already exists then return it
      return model.device.getCachedObject(req.hash, _createTexture, req);
    }

    return _createTexture(req);
  };

  publicAPI.getTextureForImageData = (imgData) => {
    const treq = { time: imgData.getMTime() };
    treq.imageData = imgData;
    // fill out the req time and format based on imageData/image
    _fillRequest(treq);
    treq.hash = treq.time + treq.format;
    return model.device.getTextureManager().getTexture(treq);
  };

  publicAPI.getTextureForVTKTexture = (srcTexture) => {
    const treq = { time: srcTexture.getMTime() };
    if (srcTexture.getInputData()) {
      treq.imageData = srcTexture.getInputData();
    } else if (srcTexture.getImage()) {
      treq.image = srcTexture.getImage();
    } else if (srcTexture.getJsImageData()) {
      treq.jsImageData = srcTexture.getJsImageData();
    } else if (srcTexture.getCanvas()) {
      treq.canvas = srcTexture.getCanvas();
    }
    // fill out the req time and format based on imageData/image
    _fillRequest(treq);
    treq.hash = treq.time + treq.format;
    return model.device.getTextureManager().getTexture(treq);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  handle: null,
  device: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);

  macro.setGet(publicAPI, model, ['device']);

  vtkWebGPUTextureManager(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
