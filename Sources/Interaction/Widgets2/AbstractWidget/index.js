import macro from 'vtk.js/Sources/macro';
import vtkInteractorObserver from 'vtk.js/Sources/Rendering/Core/InteractorObserver';
import Constants from 'vtk.js/Sources/Interaction/Widgets2/AbstractWidget/Constants';

import { RenderingTypes } from 'vtk.js/Sources/Interaction/Widgets2/WidgetManager/Constants';

const { WIDGET_PRIORITY } = Constants;

// ----------------------------------------------------------------------------

function vtkAbstractWidget(publicAPI, model) {
  model.classHierarchy.push('vtkAbstractWidget');
  model.actorToRepresentationMap = new WeakMap();

  // --------------------------------------------------------------------------

  publicAPI.activateHandle = ({ selectedState, representation }) => {
    model.widgetState.activateOnly(selectedState);
    model.activeState = selectedState;
    if (selectedState && selectedState.updateManipulator) {
      selectedState.updateManipulator();
    }
    publicAPI.invokeActivateHandle({ selectedState, representation });
  };

  // --------------------------------------------------------------------------

  publicAPI.deactivateAllHandles = () => {
    model.widgetState.deactivate();
  };

  // --------------------------------------------------------------------------

  publicAPI.hasActor = (actor) => model.actorToRepresentationMap.has(actor);

  // --------------------------------------------------------------------------

  publicAPI.getRepresentationFromActor = (actor) =>
    model.actorToRepresentationMap.get(actor);

  // --------------------------------------------------------------------------

  publicAPI.updateRepresentationForRender = (
    renderingType = RenderingTypes.FRONT_BUFFER
  ) => {
    for (let i = 0; i < model.representations.length; i++) {
      const representation = model.representations[i];
      representation.updateActorVisibility(
        renderingType,
        model.visible,
        model.visibleContext,
        model.visibleHandle
      );
    }
  };

  // --------------------------------------------------------------------------
  // Initialization calls
  // --------------------------------------------------------------------------

  publicAPI.setPriority(WIDGET_PRIORITY);
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  visible: true,
  active: true,
  visibleContext: true,
  visibleHandle: true,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkInteractorObserver.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, [
    'visible',
    'active',
    'visibleContext',
    'visibleHandle',
  ]);
  macro.get(publicAPI, model, ['representations', 'widgetState']);
  macro.event(publicAPI, model, 'ActivateHandle');

  vtkAbstractWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkAbstractWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
