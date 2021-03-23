import macro from 'vtk.js/Sources/macro';
import vtkWebGPUTexture from 'vtk.js/Sources/Rendering/WebGPU/Texture';

// const { ObjectType } = Constants;

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

function requestMatches(req1, req2) {
  if (req1.time !== req2.time) return false;
  if (req1.address !== req2.address) return false;
  //  if (req1.format !== req2.format) return false;
  if (req1.usage !== req2.usage) return false;
  return true;
}

// ----------------------------------------------------------------------------
// vtkWebGPUTextureManager methods
// ----------------------------------------------------------------------------

function vtkWebGPUTextureManager(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUTextureManager');

  publicAPI.getTexture = (req) => {
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

    if (req.usage === 'vtk') {
      // handle image data versus image
      let dims = [];
      let numComp = 4;
      if (
        Object.prototype.hasOwnProperty.call(req.address, 'isA') &&
        req.address.isA('vtkImageData')
      ) {
        dims = req.address.getDimensions();
        numComp = req.address
          .getPointData()
          .getScalars()
          .getNumberOfComponents();
      } else {
        dims[0] = req.address.width;
        dims[1] = req.address.height;
        dims[2] = 1;
        numComp = 4;
      }
      let format = 'rgba8unorm';
      switch (numComp) {
        case 1:
          format = 'r8unorm';
          break;
        case 2:
          format = 'rg8unorm';
          break;
        default:
        case 3:
        case 4:
          format = 'rgba8unorm';
          break;
      }
      newTex.create(model.device, {
        width: dims[0],
        height: dims[1],
        depth: dims[2],
        format,
      });
    }

    // cache the texture if we have a source
    // We create a new req that only has the fields required for
    // a comparison to avoid GC cycles
    if (req.source) {
      if (!model.textures.has(req.source)) {
        model.textures.set(req.source, []);
      }

      // fill the texture
      newTex.writeImageData(req.address);

      const dabuffers = model.textures.get(req.source);
      dabuffers.push({
        request: {
          time: req.time,
          address: req.address,
          // format: req.format,
          usage: req.usage,
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
