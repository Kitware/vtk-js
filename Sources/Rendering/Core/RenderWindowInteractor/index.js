import * as macro from '../../../macro';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

const eventsWeHandle = [
  'Enter',
  'Leave',
  'MouseMove',
  'LeftButtonPress',
  'LeftButtonRelease',
  'MiddleButtonPress',
  'MiddleButtonRelease',
  'RightButtonPress',
  'RightButtonRelease',
  'MouseWheelForwardEvent',
  'MouseWheelBackwardEvent',
  'ExposeEvent',
  'ConfigureEvent',
  'TimerEvent',
  'KeyPressEvent',
  'KeyReleaseEvent',
  'CharEvent',
  'DeleteEvent',
  'PinchEvent',
  'PanEvent',
  'RotateEvent',
  'TapEvent',
  'LongTapEvent',
  'SwipeEvent',
];

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------


// ----------------------------------------------------------------------------
// vtkMyClass methods
// ----------------------------------------------------------------------------

function vtkRenderWindowInteractor(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkRenderWindowInteractor');

  // Public API methods

  //----------------------------------------------------------------------
  publicAPI.start = () => {
  // Let the compositing handle the event loop if it wants to.
  // if (publicAPI.HasObserver(vtkCommand::StartEvent) && !publicAPI.HandleEventLoop) {
  //   publicAPI.invokeEvent({ type: 'StartEvent' });
  //   return;
  // }

    // As a convenience, initialize if we aren't initialized yet.
    if (!model.initialized) {
      publicAPI.initialize();
      if (!model.initialized) {
        return;
      }
    }
    // Pass execution to the subclass which will run the event loop,
    // this will not return until TerminateApp is called.
    publicAPI.startEventLoop();
  };

  //----------------------------------------------------------------------
  publicAPI.setRenderWindow = (aren) => {
    if (model.renderWindow !== aren) {
      model.renderWindow = aren;
      if (model.renderWindow != null) {
        if (model.renderWindow.getInteractor() !== publicAPI) {
          model.renderWindow.setInteractor(publicAPI);
        }
      }
    }
  };

  //----------------------------------------------------------------------
  publicAPI.setInteractorStyle = (style) => {
    if (model.interactorStyle !== style) {
      model.interactorStyle = style;
      if (model.interactorStyle != null) {
        if (model.interactorStyle.getInteractor() !== publicAPI) {
          model.interactorStyle.setInteractor(publicAPI);
        }
      }
    }
  };

  //---------------------------------------------------------------------
  publicAPI.initialize = () => {
    model.initialized = true;
    publicAPI.enable();
    publicAPI.render();
  };

  publicAPI.enable = () => publicAPI.setEnabled(true);

  publicAPI.disable = () => publicAPI.setEnabled(false);

  publicAPI.startEventLoop = () => console.log('empty event loop');

  publicAPI.setEventPosition = (xv, yv, zv, pointer) => {
    model.pointerIndex = pointer;
    model.lastEventPositions[pointer] = model.eventPositions[pointer];
    model.eventPositions[pointer] = { x: xv, y: yv, z: zv };
  };

  publicAPI.getEventPosition = (pointer) => model.eventPositions[pointer];

  publicAPI.getLastEventPosition = (pointer) => model.lastEventPositions[pointer];

  publicAPI.bindEvents = (canvas, document) => {
    model.canvas = canvas;
    canvas.onmousedown = publicAPI.handleMouseDown;
    document.onmouseup = publicAPI.handleMouseUp;
    document.onmousemove = publicAPI.handleMouseMove;
  };

  publicAPI.handleMouseDown = (event) => {
    publicAPI.setEventPosition(event.clientX, model.canvas.clientHeight - event.clientY + 1, 0, 0);
    model.controlKey = event.ctrlKey;
    model.altKey = event.altKey;
    model.shiftKey = event.shiftKey;
    switch (event.which) {
      case 1:
        publicAPI.leftButtonPressEvent();
        break;
      // case 3:
      //   publicAPI.rightButtonPressEvent();
      //   event.preventDefault();
      //   break;
      default:
        break;
    }
  };

  publicAPI.handleMouseMove = (event) => {
    publicAPI.setEventPosition(event.clientX, model.canvas.clientHeight - event.clientY + 1, 0, 0);
    publicAPI.mouseMoveEvent();
  };

  publicAPI.handleMouseUp = (event) => {
    publicAPI.setEventPosition(event.clientX, model.canvas.clientHeight - event.clientY + 1, 0, 0);
    switch (event.which) {
      case 1:
        publicAPI.leftButtonReleaseEvent();
        break;
      // case 3:
      //   publicAPI.rightButtonReleaseEvent();
      //   event.preventDefault();
      //   break;
      default:
        break;
    }
  };

  publicAPI.findPokedRenderer = (x, y) => {
    const rc = model.renderWindow.getRenderers();
    let interactiveren = null;
    let viewportren = null;
    let currentRenderer = null;

    rc.forEach(aren => {
      if (aren.isInViewport(x, y) && aren.getInteractive()) {
        currentRenderer = aren;
      }

      if (interactiveren === null && aren.getInteractive()) {
        // Save this renderer in case we can't find one in the viewport that
        // is interactive.
        interactiveren = aren;
      }
      if (viewportren === null && aren.isInViewport(x, y)) {
        // Save this renderer in case we can't find one in the viewport that
        // is interactive.
        viewportren = aren;
      }
    }); // for all renderers

    // We must have a value.  If we found an interactive renderer before, that's
    // better than a non-interactive renderer.
    if (currentRenderer === null) {
      currentRenderer = interactiveren;
    }

    // We must have a value.  If we found a renderer that is in the viewport,
    // that is better than any old viewport (but not as good as an interactive
    // one).
    if (currentRenderer === null) {
      currentRenderer = viewportren;
    }

    // We must have a value - take anything.
    if (currentRenderer == null) {
      currentRenderer = rc[0];
    }

    return currentRenderer;
  };

  //----------------------------------------------------------------------
  publicAPI.render = () => {
    if (model.renderWindow && model.enabled && model.enableRender) {
      model.renderWindow.render();
    }
    // outside the above test so that third-party code can redirect
    // the render to the appropriate class
    publicAPI.invokeRenderEvent();
  };

  // create the generic Event methods
  eventsWeHandle.forEach(eventName => {
    const lowerFirst = eventName.charAt(0).toLowerCase() + eventName.slice(1);
    publicAPI[`${lowerFirst}Event`] = () => {
      if (!model.enabled) {
        return;
      }
      publicAPI[`invoke${eventName}`]({ type: eventName });
    };
  });
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  eventPositions: null,
  lastEventPositions: null,
  pointerIndex: 0,
  renderWindow: null,
  interactorStyle: null,
  picker: null,
  pickingManager: null,
  initialized: false,
  enabled: false,
  enableRender: true,
  lightFollowCamera: true,
  desiredUpdateRate: 10.0,
  stillUpdateRate: 0.5,
  shiftKey: false,
  altKey: false,
  controlKey: false,
  canvas: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Internal objects initialization
  model.eventPositions = {};
  model.lastEventPositions = {};

  // Object methods
  macro.obj(publicAPI, model);

  macro.event(publicAPI, model, 'RenderEvent');
  eventsWeHandle.forEach(eventName =>
    macro.event(publicAPI, model, eventName));

  // Create get-only macros
  macro.get(publicAPI, model, [
    'initialized',
    'enabled',
    'enableRender',
  ]);

  // Create get-set macros
  macro.setGet(publicAPI, model, [
    'pointerIndex',
    'lightFollowCamera',
    'enabled',
    'shiftKey',
    'controlKey',
    'altKey',
  ]);

  // For more macro methods, see "Sources/macro.js"

  // Object specific methods
  vtkRenderWindowInteractor(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend });
