import macro from 'vtk.js/Sources/macro';
import { registerViewConstructor } from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkForwardPass from 'vtk.js/Sources/Rendering/WebGPU/ForwardPass';
import vtkWebGPUBuffer from 'vtk.js/Sources/Rendering/WebGPU/Buffer';
import vtkWebGPUDevice from 'vtk.js/Sources/Rendering/WebGPU/Device';
import vtkWebGPUHardwareSelector from 'vtk.js/Sources/Rendering/WebGPU/HardwareSelector';
import vtkWebGPUSwapChain from 'vtk.js/Sources/Rendering/WebGPU/SwapChain';
import vtkWebGPUViewNodeFactory from 'vtk.js/Sources/Rendering/WebGPU/ViewNodeFactory';
import vtkRenderPass from 'vtk.js/Sources/Rendering/SceneGraph/RenderPass';
import vtkRenderWindowViewNode from 'vtk.js/Sources/Rendering/SceneGraph/RenderWindowViewNode';
// import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';

const { vtkErrorMacro } = macro;
// const IS_CHROME = navigator.userAgent.indexOf('Chrome') !== -1;

// ----------------------------------------------------------------------------
// vtkWebGPURenderWindow methods
// ----------------------------------------------------------------------------

function vtkWebGPURenderWindow(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPURenderWindow');

  publicAPI.getViewNodeFactory = () => model.myFactory;

  // Auto update style
  const previousSize = [0, 0];
  function updateWindow() {
    // Canvas size
    if (model.renderable) {
      if (
        model.size[0] !== previousSize[0] ||
        model.size[1] !== previousSize[1]
      ) {
        previousSize[0] = model.size[0];
        previousSize[1] = model.size[1];
        model.canvas.setAttribute('width', model.size[0]);
        model.canvas.setAttribute('height', model.size[1]);
        publicAPI.recreateSwapChain();
      }
    }

    // ImageStream size
    if (model.viewStream) {
      // If same size that's a NoOp
      model.viewStream.setSize(model.size[0], model.size[1]);
    }

    // Offscreen ?
    model.canvas.style.display = model.useOffScreen ? 'none' : 'block';

    // Cursor type
    if (model.el) {
      model.el.style.cursor = model.cursorVisibility ? model.cursor : 'none';
    }

    // Invalidate cached DOM container size
    model.containerSize = null;
  }
  publicAPI.onModified(updateWindow);

  publicAPI.recreateSwapChain = () => {
    model.swapChain.releaseGraphicsResources();
    if (!model.swapChain.getCreated()) {
      model.swapChain.create(model.device, publicAPI);
      // model.commandBufferIndexes.clear();
      // model.commandBufferIndexes.resize(this->Swapchain->GetMaximumFramesInFlight(), -1);
    }
  };

  // Builds myself.
  publicAPI.buildPass = (prepass) => {
    if (prepass) {
      if (!model.renderable) {
        return;
      }

      publicAPI.prepareNodes();
      publicAPI.addMissingNodes(model.renderable.getRenderersByReference());
      publicAPI.removeUnusedNodes();

      publicAPI.initialize();
    } else if (model.initialized) {
      if (!model.swapChain.getCreated()) {
        model.swapChain.create(model.device, publicAPI);
      }
      model.commandEncoder = model.device.createCommandEncoder();
    }
  };

  // publicAPI.traverseRenderers = (renPass) => {
  //   // iterate over renderers
  //   const numlayers = publicAPI.getRenderable().getNumberOfLayers();
  //   const renderers = publicAPI.getChildren();
  //   for (let i = 0; i < numlayers; i++) {
  //     for (let index = 0; index < renderers.length; index++) {
  //       const renNode = renderers[index];
  //       const ren = publicAPI.getRenderable().getRenderers()[index];
  //       if (ren.getDraw() && ren.getLayer() === i) {
  //         renNode.traverse(renPass);
  //       }
  //     }
  //   }
  // };

  publicAPI.initialize = () => {
    if (!model.initializing) {
      model.initializing = true;
      if (!navigator.gpu) {
        vtkErrorMacro('WebGPU is not enabled.');
        return;
      }

      publicAPI.create3DContextAsync().then(() => {
        model.initialized = true;
        publicAPI.traverseAllPasses();
      });
    }
  };

  publicAPI.setContainer = (el) => {
    if (model.el && model.el !== el) {
      if (model.canvas.parentNode !== model.el) {
        vtkErrorMacro('Error: canvas parent node does not match container');
      }

      // Remove canvas from previous container
      model.el.removeChild(model.canvas);

      // If the renderer has previously added
      // a background image, remove it from the DOM.
      if (model.el.contains(model.bgImage)) {
        model.el.removeChild(model.bgImage);
      }
    }

    if (model.el !== el) {
      model.el = el;
      if (model.el) {
        model.el.appendChild(model.canvas);

        // If the renderer is set to use a background
        // image, attach it to the DOM.
        if (model.useBackgroundImage) {
          model.el.appendChild(model.bgImage);
        }
      }

      // Trigger modified()
      publicAPI.modified();
    }
  };

  publicAPI.getContainer = () => model.el;

  publicAPI.getContainerSize = () => {
    if (!model.containerSize && model.el) {
      const { width, height } = model.el.getBoundingClientRect();
      model.containerSize = [width, height];
    }
    return model.containerSize || model.size;
  };

  publicAPI.getFramebufferSize = () => model.size;

  publicAPI.create3DContextAsync = () => {
    // Get a GPU device to render with
    navigator.gpu.requestAdapter().then((adapter) => {
      model.adapter = adapter;
      model.device = vtkWebGPUDevice.newInstance();
      adapter.requestDevice().then((device) => {
        model.device.initialize(device);
        model.context = model.canvas.getContext('gpupresent');
      });
    });
  };

  publicAPI.restoreContext = () => {
    const rp = vtkRenderPass.newInstance();
    rp.setCurrentOperation('Release');
    rp.traverse(publicAPI, null);
  };

  publicAPI.setBackgroundImage = (img) => {
    model.bgImage.src = img.src;
  };

  publicAPI.setUseBackgroundImage = (value) => {
    model.useBackgroundImage = value;

    // Add or remove the background image from the
    // DOM as specified.
    if (model.useBackgroundImage && !model.el.contains(model.bgImage)) {
      model.el.appendChild(model.bgImage);
    } else if (!model.useBackgroundImage && model.el.contains(model.bgImage)) {
      model.el.removeChild(model.bgImage);
    }
  };

  function getCanvasDataURL(format = model.imageFormat) {
    // Copy current canvas to not modify the original
    const temporaryCanvas = document.createElement('canvas');
    const temporaryContext = temporaryCanvas.getContext('2d');
    temporaryCanvas.width = model.canvas.width;
    temporaryCanvas.height = model.canvas.height;

    publicAPI.getPixelsAsync().then((result) => {
      const imageData = new ImageData(
        result.colorValues,
        result.width,
        result.height
      );
      // temporaryCanvas.putImageData(imageData, 0, 0);
      temporaryContext.putImageData(imageData, 0, 0);

      // Get current client rect to place canvas
      const mainBoundingClientRect = model.canvas.getBoundingClientRect();

      const renderWindow = model.renderable;
      const renderers = renderWindow.getRenderers();
      renderers.forEach((renderer) => {
        const viewProps = renderer.getViewProps();
        viewProps.forEach((viewProp) => {
          // Check if the prop has a container that should have canvas
          if (viewProp.getContainer) {
            const container = viewProp.getContainer();
            const canvasList = container.getElementsByTagName('canvas');
            // Go throughout all canvas and copy it into temporary main canvas
            for (let i = 0; i < canvasList.length; i++) {
              const currentCanvas = canvasList[i];
              const boundingClientRect = currentCanvas.getBoundingClientRect();
              const newXPosition =
                boundingClientRect.x - mainBoundingClientRect.x;
              const newYPosition =
                boundingClientRect.y - mainBoundingClientRect.y;
              temporaryContext.drawImage(
                currentCanvas,
                newXPosition,
                newYPosition
              );
            }
          }
        });
      });

      const screenshot = temporaryCanvas.toDataURL(format);
      temporaryCanvas.remove();
      publicAPI.invokeImageReady(screenshot);
    });
  }

  publicAPI.captureNextImage = (format = 'image/png') => {
    if (model.deleted) {
      return null;
    }
    model.imageFormat = format;
    const previous = model.notifyStartCaptureImage;
    model.notifyStartCaptureImage = true;

    return new Promise((resolve, reject) => {
      const subscription = publicAPI.onImageReady((imageURL) => {
        model.notifyStartCaptureImage = previous;
        subscription.unsubscribe();
        resolve(imageURL);
      });
    });
  };

  publicAPI.traverseAllPasses = () => {
    if (!model.initialized) {
      publicAPI.initialize();
    } else {
      if (model.renderPasses) {
        for (let index = 0; index < model.renderPasses.length; ++index) {
          model.renderPasses[index].traverse(publicAPI, null);
        }
      }
      if (model.commandEncoder) {
        model.device.submitCommandEncoder(model.commandEncoder);
        model.commandEncoder = null;
        if (model.notifyStartCaptureImage) {
          model.device.onSubmittedWorkDone().then(() => {
            getCanvasDataURL();
          });
        }
      }
    }
  };

  publicAPI.setViewStream = (stream) => {
    if (model.viewStream === stream) {
      return false;
    }
    if (model.subscription) {
      model.subscription.unsubscribe();
      model.subscription = null;
    }
    model.viewStream = stream;
    if (model.viewStream) {
      // Force background to be transparent + render
      const mainRenderer = model.renderable.getRenderers()[0];
      mainRenderer.getBackgroundByReference()[3] = 0;

      // Enable display of the background image
      publicAPI.setUseBackgroundImage(true);

      // Bind to remote stream
      model.subscription = model.viewStream.onImageReady((e) =>
        publicAPI.setBackgroundImage(e.image)
      );
      model.viewStream.setSize(model.size[0], model.size[1]);
      model.viewStream.invalidateCache();
      model.viewStream.render();

      publicAPI.modified();
    }
    return true;
  };

  publicAPI.getUniquePropID = () => model.nextPropID++;

  publicAPI.getPropFromID = (id) => {
    for (let i = 0; i < model.children.length; i++) {
      const res = model.children[i].getPropFromID(id);
      if (res !== null) {
        return res;
      }
    }
    return null;
  };

  publicAPI.getPixelsAsync = () =>
    new Promise((resolve, reject) => {
      const device = model.device;
      const texture = model.renderPasses[0].getOpaquePass().getColorTexture();

      // as this is async we really don't want to store things in
      // the class as multiple calls may start before resolving
      // so anything specific to this request gets put into the
      // result object (by value in most cases)
      const result = {
        width: texture.getWidth(),
        height: texture.getHeight(),
      };

      // must be a multiple of 256 bytes, so 64 texels with rgba8
      result.colorBufferWidth = 64 * Math.floor((result.width + 63) / 64);
      result.colorBufferSizeInBytes =
        result.colorBufferWidth * result.height * 4;
      const colorBuffer = vtkWebGPUBuffer.newInstance();
      colorBuffer.setDevice(device);
      /* eslint-disable no-bitwise */
      /* eslint-disable no-undef */
      colorBuffer.create(
        result.colorBufferSizeInBytes,
        GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
      );
      /* eslint-enable no-bitwise */
      /* eslint-enable no-undef */

      const cmdEnc = model.device.createCommandEncoder();
      cmdEnc.copyTextureToBuffer(
        {
          texture: texture.getHandle(),
        },
        {
          buffer: colorBuffer.getHandle(),
          bytesPerRow: 4 * result.colorBufferWidth,
          rowsPerImage: result.height,
        },
        {
          width: result.width,
          height: result.height,
          depthOrArrayLayers: 1,
        }
      );
      device.submitCommandEncoder(cmdEnc);

      /* eslint-disable no-undef */
      const cLoad = colorBuffer.mapAsync(GPUMapMode.READ);
      /* eslint-enable no-undef */

      cLoad.then(() => {
        result.colorValues = new Uint8ClampedArray(
          colorBuffer.getMappedRange().slice()
        );
        colorBuffer.unmap();
        // repack the array
        const tmparray = new Uint8ClampedArray(
          result.height * result.width * 4
        );
        for (let y = 0; y < result.height; y++) {
          for (let x = 0; x < result.width; x++) {
            const doffset = (y * result.width + x) * 4;
            const soffset = (y * result.colorBufferWidth + x) * 4;
            tmparray[doffset] = result.colorValues[soffset + 2];
            tmparray[doffset + 1] = result.colorValues[soffset + 1];
            tmparray[doffset + 2] = result.colorValues[soffset];
            tmparray[doffset + 3] = result.colorValues[soffset + 3];
          }
        }
        result.colorValues = tmparray;
        resolve(result);
      });
    });

  publicAPI.delete = macro.chain(publicAPI.delete, publicAPI.setViewStream);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  initialized: false,
  context: null,
  adapter: null,
  device: null,
  canvas: null,
  swapChain: null,
  cursorVisibility: true,
  cursor: 'pointer',
  containerSize: null,
  renderPasses: [],
  notifyStartCaptureImage: false,
  imageFormat: 'image/png',
  useOffScreen: false,
  useBackgroundImage: false,
  nextPropID: 1,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Create internal instances
  model.canvas = document.createElement('canvas');
  model.canvas.style.width = '100%';

  // Create internal bgImage
  model.bgImage = new Image();
  model.bgImage.style.position = 'absolute';
  model.bgImage.style.left = '0';
  model.bgImage.style.top = '0';
  model.bgImage.style.width = '100%';
  model.bgImage.style.height = '100%';
  model.bgImage.style.zIndex = '-1';

  model.swapChain = vtkWebGPUSwapChain.newInstance();

  // Inheritance
  vtkRenderWindowViewNode.extend(publicAPI, model, initialValues);

  model.myFactory = vtkWebGPUViewNodeFactory.newInstance();
  /* eslint-disable no-use-before-define */
  model.myFactory.registerOverride('vtkRenderWindow', newInstance);
  /* eslint-enable no-use-before-define */

  // setup default forward pass rendering
  model.renderPasses[0] = vtkForwardPass.newInstance();

  if (!model.selector) {
    model.selector = vtkWebGPUHardwareSelector.newInstance();
    model.selector.setWebGPURenderWindow(publicAPI);
  }

  macro.event(publicAPI, model, 'imageReady');

  // Build VTK API
  macro.get(publicAPI, model, [
    'swapChain',
    'commandEncoder',
    'device',
    'useBackgroundImage',
  ]);

  macro.setGet(publicAPI, model, [
    'initialized',
    'context',
    'canvas',
    'device',
    'renderPasses',
    'notifyStartCaptureImage',
    'cursor',
    'useOffScreen',
  ]);

  macro.setGetArray(publicAPI, model, ['size'], 2);

  // Object methods
  vtkWebGPURenderWindow(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWebGPURenderWindow');

// ----------------------------------------------------------------------------
// Register API specific RenderWindow implementation
// ----------------------------------------------------------------------------

registerViewConstructor('WebGPU', newInstance);

// ----------------------------------------------------------------------------

export default {
  newInstance,
  extend,
};
