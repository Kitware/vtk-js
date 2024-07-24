import macro from 'vtk.js/Sources/macros';
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
      model._interactor.requestAnimation(publicAPI);
      publicAPI.invokeStartInteractionEvent({ type: 'StartInteractionEvent' });
      publicAPI[`invokeStart${key}Event`]({ type: `Start${key}Event` });
    };
    macro.event(publicAPI, model, `End${key}Event`);
    publicAPI[`end${key}`] = () => {
      if (model.state !== stateNames[key]) {
        return;
      }
      model.state = States.IS_NONE;
      model._interactor.cancelAnimation(publicAPI);
      publicAPI.invokeEndInteractionEvent({ type: 'EndInteractionEvent' });
      publicAPI[`invokeEnd${key}Event`]({ type: `End${key}Event` });
      model._interactor.render();
    };
  });

  model.getRenderer = (callData) =>
    model.focusedRenderer || callData.pokedRenderer;

  //----------------------------------------------------------------------------
  publicAPI.handleKeyPress = (callData) => {
    const rwi = model._interactor;
    let ac = null;
    switch (callData.key) {
      case 'r':
      case 'R':
        model.getRenderer(callData).resetCamera();
        rwi.render();
        break;

      case 'w':
      case 'W':
        ac = model.getRenderer(callData).getActors();
        ac.forEach((anActor) => {
          const prop = anActor.getProperty();
          if (prop.setRepresentationToWireframe) {
            prop.setRepresentationToWireframe();
          }
        });
        rwi.render();
        break;

      case 's':
      case 'S':
        ac = model.getRenderer(callData).getActors();
        ac.forEach((anActor) => {
          const prop = anActor.getProperty();
          if (prop.setRepresentationToSurface) {
            prop.setRepresentationToSurface();
          }
        });
        rwi.render();
        break;

      case 'v':
      case 'V':
        ac = model.getRenderer(callData).getActors();
        ac.forEach((anActor) => {
          const prop = anActor.getProperty();
          if (prop.setRepresentationToPoints) {
            prop.setRepresentationToPoints();
          }
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

  macro.setGet(publicAPI, model, ['focusedRenderer']);

  // Object specific methods
  vtkInteractorStyle(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkInteractorStyle');

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...Constants };
