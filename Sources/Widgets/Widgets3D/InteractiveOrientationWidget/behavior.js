import macro from 'vtk.js/Sources/macro';

export default function widgetBehavior(publicAPI, model) {
  model.classHierarchy.push('vtkInteractiveOrientationWidgetProp');

  // --------------------------------------------------------------------------
  // Right click: Delete handle
  // --------------------------------------------------------------------------

  publicAPI.handleRightButtonPress = (e) => {
    if (
      !model.activeState ||
      !model.activeState.getActive() ||
      !model.pickable
    ) {
      return macro.VOID;
    }

    console.log('right click');

    publicAPI.invokeStartInteractionEvent();
    publicAPI.invokeInteractionEvent();
    publicAPI.invokeEndInteractionEvent();
    return macro.EVENT_ABORT;
  };

  // --------------------------------------------------------------------------
  // Left press: Select handle to drag
  // --------------------------------------------------------------------------

  publicAPI.handleLeftButtonPress = (e) => {
    if (
      !model.activeState ||
      !model.activeState.getActive() ||
      !model.pickable
    ) {
      return macro.VOID;
    }

    console.log(model.activeState.get());

    console.log('left button press');

    return macro.EVENT_ABORT;
  };

  // --------------------------------------------------------------------------
  // Left release: Finish drag / Create new handle
  // --------------------------------------------------------------------------

  publicAPI.handleLeftButtonRelease = () => {
    console.log('left button release');
    model.widgetState.deactivate();
    if (model.pickable) {
      model.interactor.cancelAnimation(publicAPI);
      publicAPI.invokeEndInteractionEvent();
    }
  };

  publicAPI.handleRightButtonRelease = () => {
    console.log('right button release');
    model.widgetState.deactivate();
    if (model.pickable) {
      model.interactor.cancelAnimation(publicAPI);
      publicAPI.invokeEndInteractionEvent();
    }
  };
}
