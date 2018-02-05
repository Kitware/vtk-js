import macro from 'vtk.js/Sources/macro';
import vtkInteractorObserver from 'vtk.js/Sources/Rendering/Core/InteractorObserver';
import Constants from 'vtk.js/Sources/Rendering/Core/InteractorStyle/Constants';

const { States } = Constants;
const { vtkWarningMacro } = macro;

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
  CameraPose: States.IS_CAMERA_POSE,
  WindowLevel: States.IS_WINDOW_LEVEL,
  Slice: States.IS_SLICE,
};

const events = [
  'Animation',
  'MouseMove',
  'LeftButtonPress',
  'LeftButtonRelease',
  'MiddleButtonPress',
  'MiddleButtonRelease',
  'RightButtonPress',
  'RightButtonRelease',
  'KeyPress',
  'KeyUp',
  'StartPinch',
  'Pinch',
  'EndPinch',
  'StartPan',
  'Pan',
  'EndPan',
  'StartRotate',
  'Rotate',
  'EndRotate',
  'Button3D',
  'Move3D',
];

// ----------------------------------------------------------------------------
// vtkInteractorStyle methods
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
      while (model.unsubscribes.length) {
        model.unsubscribes.pop().unsubscribe();
      }
    }

    model.interactor = i;

    if (i) {
      events.forEach((eventName) => {
        model.unsubscribes.push(
          i[`on${eventName}`]((data) => {
            if (publicAPI[`handle${eventName}`]) {
              publicAPI[`handle${eventName}`](data);
            }
          })
        );
      });
    }
  };

  // create bunch of Start/EndState methods
  Object.keys(stateNames).forEach((key) => {
    macro.event(publicAPI, model, `Start${key}Event`);
    publicAPI[`start${key}`] = () => {
      if (model.state !== States.IS_NONE) {
        return;
      }
      model.state = stateNames[key];
      model.interactor.requestAnimation(publicAPI);
      publicAPI.invokeStartInteractionEvent({ type: 'StartInteractionEvent' });
      publicAPI[`invokeStart${key}Event`]({ type: `Start${key}Event` });
    };
    macro.event(publicAPI, model, `End${key}Event`);
    publicAPI[`end${key}`] = () => {
      if (model.state !== stateNames[key]) {
        return;
      }
      model.state = States.IS_NONE;
      model.interactor.cancelAnimation(publicAPI);
      publicAPI.invokeEndInteractionEvent({ type: 'EndInteractionEvent' });
      publicAPI[`invokeEnd${key}Event`]({ type: `End${key}Event` });
      model.interactor.render();
    };
  });

  //----------------------------------------------------------------------------
  publicAPI.handleKeyPress = () => {
    const rwi = model.interactor;

    let pos = null;

    switch (rwi.getKeyCode()) {
      case 'r':
      case 'R':
        pos = rwi.getEventPosition();
        publicAPI.findPokedRenderer(pos.x, pos.y);
        if (model.currentRenderer !== 0) {
          model.currentRenderer.resetCamera();
        } else {
          vtkWarningMacro('no current renderer on the interactor style.');
        }
        rwi.render();
        break;

      case 'w':
      case 'W':
        pos = rwi.getEventPosition();
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

      case 's':
      case 'S':
        pos = rwi.getEventPosition();
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

      case 'v':
      case 'V':
        pos = rwi.getEventPosition();
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
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  state: States.IS_NONE,
  handleObservers: 1,
  autoAdjustCameraClippingRange: 1,
  unsubscribes: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkInteractorObserver.extend(publicAPI, model, initialValues);

  model.unsubscribes = [];

  // Object specific methods
  vtkInteractorStyle(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkInteractorStyle');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, Constants);
