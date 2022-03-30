import macro from 'vtk.js/Sources/macros';
import vtkInteractorObserver from 'vtk.js/Sources/Rendering/Core/InteractorObserver';
import vtkProp from 'vtk.js/Sources/Rendering/Core/Prop';

import { RenderingTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';
import { WIDGET_PRIORITY } from 'vtk.js/Sources/Widgets/Core/AbstractWidget/Constants';

// ----------------------------------------------------------------------------

function vtkAbstractWidget(publicAPI, model) {
  model.classHierarchy.push('vtkAbstractWidget');
  model.actorToRepresentationMap = new WeakMap();

  // --------------------------------------------------------------------------
  publicAPI.getBounds = model.widgetState.getBounds;
  publicAPI.getNestedProps = () => model.representations;
  // --------------------------------------------------------------------------

  publicAPI.activateHandle = ({ selectedState, representation }) => {
    model.widgetState.activateOnly(selectedState);
    model.activeState = selectedState;
    if (selectedState && selectedState.updateManipulator) {
      selectedState.updateManipulator();
    }
    publicAPI.invokeActivateHandle({ selectedState, representation });
    if (publicAPI.updateCursor) {
      publicAPI.updateCursor();
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.deactivateAllHandles = () => {
    model.widgetState.deactivate();
  };

  // --------------------------------------------------------------------------

  publicAPI.hasActor = (actor) => model.actorToRepresentationMap.has(actor);

  // --------------------------------------------------------------------------

  publicAPI.grabFocus = () => {
    model.hasFocus = true;
  };
  publicAPI.loseFocus = () => {
    model.hasFocus = false;
  };
  publicAPI.hasFocus = () => model.hasFocus;

  // --------------------------------------------------------------------------

  publicAPI.placeWidget = (bounds) => model.widgetState.placeWidget(bounds);
  publicAPI.getPlaceFactor = () => model.widgetState.getPlaceFactor();
  publicAPI.setPlaceFactor = (factor) =>
    model.widgetState.setPlaceFactor(factor);

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
        model.contextVisibility,
        model.handleVisibility
      );
    }
  };

  publicAPI.getViewWidgets = () =>
    model._factory
      .getViewIds()
      .map((viewId) => model._factory.getWidgetForView({ viewId }));

  // --------------------------------------------------------------------------
  // Initialization calls
  // --------------------------------------------------------------------------

  publicAPI.setPriority(WIDGET_PRIORITY);
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  contextVisibility: true,
  handleVisibility: true,
  hasFocus: false,
};

/**
 * @param {*} publicAPI public methods to populate
 * @param {*} model internal values to populate
 * @param {object} initialValues Contains at least
 *   {viewType, _renderer, _camera, _openGLRenderWindow, _factory}
 */
export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkProp.extend(publicAPI, model, initialValues);
  vtkInteractorObserver.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, [
    'contextVisibility',
    'handleVisibility',
    '_widgetManager',
  ]);
  macro.get(publicAPI, model, ['representations', 'widgetState']);
  macro.moveToProtected(publicAPI, model, ['widgetManager']);
  macro.event(publicAPI, model, 'ActivateHandle');

  vtkAbstractWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkAbstractWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
