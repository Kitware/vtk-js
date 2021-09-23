import macro from 'vtk.js/Sources/macros';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkWebGPUTexture from 'vtk.js/Sources/Rendering/WebGPU/Texture';

const { VtkDataTypes } = vtkDataArray;

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

function requestMatches(req1, req2) {
  if (req1.time !== req2.time) return false;
  if (req1.nativeArray !== req2.nativeArray) return false;
  if (req1.format !== req2.format) return false;
  return true;
}

// ----------------------------------------------------------------------------
// vtkWebGPUTextureManager methods
// ----------------------------------------------------------------------------

function vtkWebGPUTextureManager(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUTextureManager');

  // The keys fields of a request are
  // - source, this is what owns the data and when it does away
  //   the data should be freed
  // - imageData - when provided use as the source of the data
  //

  publicAPI.getTexture = (req) => {
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
        default:
        case 3:
        case 4:
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
      req.time = 0;
      req.width = req.image.width;
      req.height = req.image.height;
      req.depth = 1;
      req.format = 'rgba8unorm';
    }

    if (req.source) {
      // if a matching texture already exists then return it
      if (model.textures.has(req.source)) {
        const dabuffers = model.textures.get(req.source);
        for (let i = 0; i < dabuffers.length; i++) {
          if (requestMatches(dabuffers[i].request, req)) {
            return dabuffers[i].texture;
          }
        }
      }
    }

    const newTex = vtkWebGPUTexture.newInstance();

    newTex.create(model.device, {
      width: req.width,
      height: req.height,
      depth: req.depth,
      format: req.format,
    });

    // fill the texture if we have data
    if (req.nativeArray || req.image) {
      newTex.writeImageData(req);
    }

    // cache the texture if we have a source
    // We create a new req that only has the fields required for
    // a comparison to avoid GC cycles
    if (req.source) {
      if (!model.textures.has(req.source)) {
        model.textures.set(req.source, []);
      }

      const dabuffers = model.textures.get(req.source);
      dabuffers.push({
        request: {
          time: req.time,
          nativeArray: req.nativeArray,
          format: req.format,
        },
        texture: newTex,
      });
    }
    return newTex;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  textures: null,
  handle: null,
  device: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);

  // this is a cache, and a cache with GC pretty much means WeakMap
  model.textures = new WeakMap();

  macro.setGet(publicAPI, model, ['device']);

  vtkWebGPUTextureManager(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
