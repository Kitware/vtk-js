import macro from 'vtk.js/Sources/macros';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkCanvasView methods
// ----------------------------------------------------------------------------

function vtkCanvasView(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCanvasView');

  // Auto update style
  function updateWindow() {
    // Canvas size
    if (model.renderable) {
      model.canvas.setAttribute('width', model.size[0]);
      model.canvas.setAttribute('height', model.size[1]);
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
  }
  publicAPI.onModified(updateWindow);

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
      }

      // If the renderer is set to use a background
      // image, attach it to the DOM.
      if (model.useBackgroundImage) {
        model.el.appendChild(model.bgImage);
      }

      // Trigger modified()
      publicAPI.modified();
    }
  };

  publicAPI.setBackgroundImage = (img) => {
    model.bgImage.src = img.src;
  };

  publicAPI.setUseBackgroundImage = (value) => {
    model.useBackgroundImage = value;

    // Add or remove the background image from the
    // DOM as specified.
    if (
      model.useBackgroundImage &&
      model.el &&
      !model.el.contains(model.bgImage)
    ) {
      model.el.appendChild(model.bgImage);
    } else if (
      !model.useBackgroundImage &&
      model.el &&
      model.el.contains(model.bgImage)
    ) {
      model.el.removeChild(model.bgImage);
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

  publicAPI.delete = macro.chain(publicAPI.setViewStream, publicAPI.delete);

  // --------------------------------------------------------------------------
  // Make us look like a View (i.e.: vtkOpenGLRenderWindow)
  // --------------------------------------------------------------------------
  model.renderable = publicAPI;
  model.renderers = [publicAPI];
  publicAPI.traverseAllPasses = () => {};
  publicAPI.isInViewport = () => true;
  publicAPI.getInteractive = () => true;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  canvas: null,
  size: [300, 300],
  cursorVisibility: true,
  cursor: 'pointer',
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

  // Inheritance
  macro.obj(publicAPI, model, initialValues);

  // Build VTK API
  macro.get(publicAPI, model, ['useBackgroundImage', 'renderable']);

  macro.setGet(publicAPI, model, [
    'canvas',
    'cursor',
    'useOffScreen',
    'interactor',
  ]);

  macro.setGetArray(publicAPI, model, ['size'], 2);
  macro.getArray(publicAPI, model, ['renderers']);

  // Object methods
  vtkCanvasView(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkCanvasView');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
