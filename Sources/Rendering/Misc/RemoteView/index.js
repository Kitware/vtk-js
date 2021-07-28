import macro from 'vtk.js/Sources/macros';
import vtkCanvasView from 'vtk.js/Sources/Rendering/Misc/CanvasView';
import vtkImageStream from 'vtk.js/Sources/IO/Core/ImageStream';
import vtkInteractorStyleRemoteMouse from 'vtk.js/Sources/Interaction/Style/InteractorStyleRemoteMouse';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';

const SHARED_IMAGE_STREAM = vtkImageStream.newInstance();
export const connectImageStream = SHARED_IMAGE_STREAM.connect;
export const disconnectImageStream = SHARED_IMAGE_STREAM.disconnect;

// ----------------------------------------------------------------------------
// vtkRemoteView methods
// ----------------------------------------------------------------------------

function vtkRemoteView(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkRemoteView');

  // Constructor
  model.canvasView = vtkCanvasView.newInstance();
  model.interactorStyle = vtkInteractorStyleRemoteMouse.newInstance();

  model.interactor = vtkRenderWindowInteractor.newInstance();
  model.interactor.setView(model.canvasView);
  model.interactor.initialize();
  model.interactor.setInteractorStyle(model.interactorStyle);

  // Mouse
  model.interactorStyle.onRemoteMouseEvent((e) => {
    if (model.session && model.rpcMouseEvent) {
      model.session.call(model.rpcMouseEvent, [e]);
    }
  });
  // Wheel
  model.interactorStyle.onRemoteWheelEvent((e) => {
    if (model.session && model.rpcWheelEvent) {
      model.session.call(model.rpcWheelEvent, [e]);
    }
  });
  // Gesture
  model.interactorStyle.onRemoteGestureEvent((e) => {
    if (model.session && model.rpcGestureEvent) {
      model.session.call(model.rpcGestureEvent, [e]);
    }
  });

  // --------------------------------------------------------------------------
  // API
  // --------------------------------------------------------------------------

  publicAPI.delete = macro.chain(() => {
    model.session = null;
    if (model.canvasView) {
      model.canvasView.setViewStream(null);
      model.canvasView.delete();
    }
    if (model.interactor) {
      model.interactor.delete();
    }
    if (model.viewStream) {
      model.viewStream.delete();
    }
  }, publicAPI.delete);

  // --------------------------------------------------------------------------
  // remote handing
  // --------------------------------------------------------------------------

  publicAPI.setViewStream = (viewStream) => {
    model.viewStream = viewStream;
    model.canvasView.setViewStream(model.viewStream);

    // Configure image quality
    model.viewStream.setStillQuality(model.stillQuality);
    model.viewStream.setStillRatio(model.stillRatio);
    model.viewStream.setInteractiveQuality(model.interactiveQuality);
    model.viewStream.setInteractiveRatio(model.interactiveRatio);

    // Link user interactions
    model.interactor.onStartAnimation(model.viewStream.startInteraction);
    model.interactor.onEndAnimation(model.viewStream.endInteraction);

    publicAPI.setViewId(viewStream.getViewId());
  };

  publicAPI.setViewId = (id) => {
    if (!model.viewStream) {
      publicAPI.setViewStream(SHARED_IMAGE_STREAM.createViewStream(id));
    }

    model.viewStream.setViewId(id);
    model.interactorStyle.setRemoteEventAddOn({ view: id });
    publicAPI.modified();
  };

  // --------------------------------------------------------------------------
  // DOM handling
  // --------------------------------------------------------------------------

  publicAPI.setContainer = (container) => {
    if (model.container) {
      model.interactor.unbindEvents(container);
    }

    // Capture container
    model.container = container;
    model.canvasView.setContainer(model.container);

    // Attach listeners
    if (container) {
      model.interactor.bindEvents(container);
      publicAPI.resize();
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.resize = () => {
    if (model.container && model.canvasView) {
      const { width, height } = model.container.getBoundingClientRect();
      model.canvasView.setSize(width, height);
      publicAPI.render();
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.render = () => {
    if (model.viewStream) {
      model.viewStream.render();
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.resetCamera = () => {
    if (model.viewStream) {
      model.viewStream.resetCamera();
    }
  };

  // --------------------------------------------------------------------------
  // viewStream setters
  // --------------------------------------------------------------------------
  const internal = { modified: publicAPI.modified };
  macro.set(internal, model, [
    'interactiveQuality',
    'interactiveRatio',
    'stillQuality',
    'stillRatio',
  ]);

  publicAPI.setInteractiveQuality = (q) => {
    const changeDetected = internal.setInteractiveQuality(q);
    if (model.viewStream && changeDetected) {
      model.viewStream.setInteractiveQuality(model.interactiveQuality);
    }
    return changeDetected;
  };

  publicAPI.setInteractiveRatio = (r) => {
    const changeDetected = internal.setInteractiveRatio(r);
    if (model.viewStream && changeDetected) {
      model.viewStream.setInteractiveRatio(model.interactiveRatio);
    }
    return changeDetected;
  };

  publicAPI.setStillQuality = (q) => {
    const changeDetected = internal.setStillQuality(q);
    if (model.viewStream && changeDetected) {
      model.viewStream.setStillQuality(model.stillQuality);
    }
    return changeDetected;
  };

  publicAPI.setStillRatio = (r) => {
    const changeDetected = internal.setStillRatio(r);
    if (model.viewStream && changeDetected) {
      model.viewStream.setStillRatio(model.stillRatio);
    }
    return changeDetected;
  };

  // Initialize viewStream if available
  if (model.viewStream) {
    publicAPI.setViewStream(model.viewStream);
  }
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  viewId: '-1',
  interactiveQuality: 60,
  interactiveRatio: 1 / window.devicePixelRatio,
  stillQuality: 100,
  stillRatio: 1,
  rpcMouseEvent: 'viewport.mouse.interaction',
  rpcGestureEvent: null,
  rpcWheelEvent: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model, initialValues);
  macro.get(publicAPI, model, [
    'container',
    'viewStream',
    'canvasView',
    'interactor',
    'interactorStyle',
    'interactiveQuality',
    'interactiveRatio',
    'stillQuality',
    'stillRatio',
  ]);
  macro.setGet(publicAPI, model, [
    'session',
    'rpcMouseEvent',
    'rpcGestureEvent',
    'rpcWheelEvent',
  ]);

  // Object methods
  vtkRemoteView(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkRemoteView');

// ----------------------------------------------------------------------------

export default {
  newInstance,
  extend,
  SHARED_IMAGE_STREAM,
  connectImageStream,
  disconnectImageStream,
};
