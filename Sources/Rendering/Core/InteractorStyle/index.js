import * as macro from '../../../macro';
import vtkInteractorObserver from '../InteractorObserver';
import { States } from './Constants';  // { ENUM_1: 0, ENUM_2: 1, ... }

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

// Add module-level functions or api that you want to expose statically via
// the next section...

const stateNames = {
  Rotate: States.IS_ROTATE,
  Pan: States.IS_PAN,
  Spin: States.IS_SPIN,
  Dolly: States.IS_DOLLY,
  Zoom: States.IS_ZOOM,
  Timer: States.IS_TIMER,
  TwoPointer: States.IS_TWO_POINTER,
  UniformScale: States.IS_USCALE,
};

const events = [
  'Enter',
  'Leave',
  'MouseMove',
  'LeftButtonPress',
  'LeftButtonRelease',
  'MiddleButtonPress',
  'MiddleButtonRelease',
  'RightButtonPress',
  'RightButtonRelease',
  'MouseWheelForward',
  'MouseWheelBackward',
  'Expose',
  'Configure',
  'Timer',
  'KeyPress',
  'KeyRelease',
  'Char',
  'Delete',
  'Pinch',
  'Pan',
  'Rotate',
  'Tap',
  'LongTap',
  'Swipe',
];

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// vtkMyClass methods
// ----------------------------------------------------------------------------

function vtkInteractorStyle(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkInteractorStyle');

  // Public API methods
  publicAPI.setInteractor = (i) => {
    if (i === model.interactor) {
      return;
    }

    // if we already have an Interactor then stop observing it
    if (model.interactor) {
      model.unsubscribes.forEach(val => val.unsubscribe());
      model.unsubscribes.clear();
    }

    model.interactor = i;

    if (i) {
      events.forEach((eventName) => {
        model.unsubscribes.set(eventName,
        i[`on${eventName}`](() => {
          if (publicAPI[`handle${eventName}`]) {
            publicAPI[`handle${eventName}`]();
          }
        }));
      });
    }
  };

  // create bunch of Start/EndState methods
  Object.keys(stateNames).forEach((key) => {
    publicAPI[`start${key}`] = () => {
      if (model.state !== States.IS_NONE) {
        return;
      }
      publicAPI.startState(stateNames[key]);
    };
    publicAPI[`end${key}`] = () => {
      if (model.state !== stateNames[key]) {
        return;
      }
      publicAPI.stopState();
    };
  });

  //----------------------------------------------------------------------------
  publicAPI.handleChar = () => {
    const rwi = model.interactor;

    let pos = null;

    switch (rwi.getKeyCode()) {
      case 'r' :
      case 'R' :
        pos = model.interactor.getEventPosition(rwi.getPointerIndex());
        publicAPI.findPokedRenderer(pos.x, pos.y);
        if (model.currentRenderer !== 0) {
          model.currentRenderer.resetCamera();
        } else {
          vtkWarningMacro('no current renderer on the interactor style.');
        }
        rwi.render();
        break;

      case 'w' :
      case 'W' :
        pos = model.interactor.getEventPosition(rwi.getPointerIndex());
        publicAPI.findPokedRenderer(pos.x, pos.y);
        if (model.currentRenderer !== 0) {
          const ac = model.currentRenderer.getActors();
          ac.forEach((anActor) => {
            anActor.getProperty().setRepresentationToWireframe();
          });
        } else {
          vtkWarningMacro('no current renderer on the interactor style.');
        }
        rwi.render();
        break;

      case 's' :
      case 'S' :
        pos = model.interactor.getEventPosition(rwi.getPointerIndex());
        publicAPI.findPokedRenderer(pos.x, pos.y);
        if (model.currentRenderer !== 0) {
          const ac = model.currentRenderer.getActors();
          ac.forEach((anActor) => {
            anActor.getProperty().setRepresentationToSurface();
          });
        } else {
          vtkWarningMacro('no current renderer on the interactor style.');
        }
        rwi.render();
        break;

      case 'v' :
      case 'V' :
        pos = model.interactor.getEventPosition(rwi.getPointerIndex());
        publicAPI.findPokedRenderer(pos.x, pos.y);
        if (model.currentRenderer !== 0) {
          const ac = model.currentRenderer.getActors();
          ac.forEach((anActor) => {
            anActor.getProperty().setRepresentationToPoints();
          });
        } else {
          vtkWarningMacro('no current renderer on the interactor style.');
        }
        rwi.render();
        break;

      default:
        break;
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.findPokedRenderer = (x, y) => {
    publicAPI.setCurrentRenderer(model.interactor.findPokedRenderer(x, y));
  };

  publicAPI.startState = (state) => {
    model.state = state;
    if (model.animationState === States.IS_ANIM_OFF) {
      const rwi = model.interactor;
      rwi.getRenderWindow().setDesiredUpdateRate(rwi.getDesiredUpdateRate());
      model.invokeStartInteractionEvent({ type: 'StartInteractionEvent' });
    }
  };

  publicAPI.stopState = () => {
    model.state = States.IS_NONE;
    if (model.animationState === States.IS_ANIM_OFF) {
      const rwi = model.interactor;
      rwi.getRenderWindow().setDesiredUpdateRate(rwi.getStillUpdateRate());
      publicAPI.invokeEndInteractionEvent({ type: 'EndInteractionEvent' });
      rwi.render();
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  state: States.IS_NONE,
  animState: States.IS_ANIM_OFF,
  handleObservers: 1,
  autoAdjustCameraClippingRange: 1,
  unsubscribes: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkInteractorObserver.extend(publicAPI, model);

  // Object methods
  macro.obj(publicAPI, model);

  model.unsubscribes = new Map();

  // Object specific methods
  vtkInteractorStyle(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkInteractorStyle');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend });
