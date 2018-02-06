import macro from 'vtk.js/Sources/macro';
import vtkInteractorObserver from 'vtk.js/Sources/Rendering/Core/InteractorObserver';
import Constants from 'vtk.js/Sources/Rendering/Core/InteractorStyle/Constants';

const { States } = Constants;

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

// ----------------------------------------------------------------------------
// vtkInteractorStyle methods
// ----------------------------------------------------------------------------

function vtkInteractorStyle(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkInteractorStyle');

  // Public API methods
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
  publicAPI.handleKeyPress = (callData) => {
    const rwi = model.interactor;
    let ac = null;
    switch (callData.key) {
      case 'r':
      case 'R':
        callData.pokedRenderer.resetCamera();
        rwi.render();
        break;

      case 'w':
      case 'W':
        ac = callData.pokedRenderer.getActors();
        ac.forEach((anActor) => {
          anActor.getProperty().setRepresentationToWireframe();
        });
        rwi.render();
        break;

      case 's':
      case 'S':
        ac = callData.pokedRenderer.getActors();
        ac.forEach((anActor) => {
          anActor.getProperty().setRepresentationToSurface();
        });
        rwi.render();
        break;

      case 'v':
      case 'V':
        ac = callData.pokedRenderer.getActors();
        ac.forEach((anActor) => {
          anActor.getProperty().setRepresentationToPoints();
        });
        rwi.render();
        break;

      default:
        break;
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  state: States.IS_NONE,
  handleObservers: 1,
  autoAdjustCameraClippingRange: 1,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkInteractorObserver.extend(publicAPI, model, initialValues);

  // Object specific methods
  vtkInteractorStyle(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkInteractorStyle');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, Constants);
