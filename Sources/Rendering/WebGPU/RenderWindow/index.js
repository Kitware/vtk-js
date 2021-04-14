import macro from 'vtk.js/Sources/macro';
import { registerViewConstructor } from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkForwardPass from 'vtk.js/Sources/Rendering/WebGPU/ForwardPass';
import vtkWebGPUDevice from 'vtk.js/Sources/Rendering/WebGPU/Device';
import vtkWebGPUSwapChain from 'vtk.js/Sources/Rendering/WebGPU/SwapChain';
import vtkWebGPUViewNodeFactory from 'vtk.js/Sources/Rendering/WebGPU/ViewNodeFactory';
import vtkRenderPass from 'vtk.js/Sources/Rendering/SceneGraph/RenderPass';
import vtkRenderWindowViewNode from 'vtk.js/Sources/Rendering/SceneGraph/RenderWindowViewNode';
// import vtkOpenGLTextureUnitManager from 'vtk.js/Sources/Rendering/OpenGL/TextureUnitManager';
// import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';

const { vtkErrorMacro } = macro;
// const IS_CHROME = navigator.userAgent.indexOf('Chrome') !== -1;

// ----------------------------------------------------------------------------
// vtkWebGPURenderWindow methods
// ----------------------------------------------------------------------------

function vtkWebGPURenderWindow(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPURenderWindow');

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
      // model.children.forEach((child) => {
      //   child.setOpenGLRenderWindow(publicAPI);
      // });
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
      publicAPI.create3DContext(); // async
    }
  };

  publicAPI.makeCurrent = () => {
    model.context.makeCurrent();
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

  publicAPI.create3DContext = () => {
    model.initializing = true;
    (async () => {
      if (!navigator.gpu) {
        vtkErrorMacro('WebGPU is not enabled.');
        return;
      }

      // Get a GPU device to render with
      model.adapter = await navigator.gpu.requestAdapter();
      model.device = vtkWebGPUDevice.newInstance();
      model.device.initialize(await model.adapter.requestDevice());
      model.context = model.canvas.getContext('gpupresent');
      model.initialized = true;
    })();
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
    temporaryContext.drawImage(model.canvas, 0, 0);

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
      }

      if (model.notifyStartCaptureImage) {
        vtkErrorMacro('Getting image');
        getCanvasDataURL();
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
  cullFaceEnabled: false,
  depthMaskEnabled: true,
  cursorVisibility: true,
  cursor: 'pointer',
  textureUnitManager: null,
  textureResourceIds: null,
  containerSize: null,
  renderPasses: [],
  notifyStartCaptureImage: false,
  imageFormat: 'image/png',
  useOffScreen: false,
  useBackgroundImage: false,
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

  macro.event(publicAPI, model, 'imageReady');

  // Build VTK API
  macro.get(publicAPI, model, [
    'swapChain',
    'commandEncoder',
    'device',
    'textureUnitManager',
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
