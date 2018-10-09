import macro from 'vtk.js/Sources/macro';

export default function widgetBehavior(publicAPI, model) {
  model.classHierarchy.push('vtkInteractiveOrientationWidgetProp');
  macro.event(publicAPI, model, 'OrientationChange');

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
    publicAPI.invokeOrientationChange(
      Object.assign(
        { action: 'rightPress', event: e },
        model.activeState.get('up', 'right', 'direction')
      )
    );
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
    publicAPI.invokeOrientationChange(
      Object.assign(
        { action: 'leftPress', event: e },
        model.activeState.get('up', 'right', 'direction')
      )
    );
    return macro.EVENT_ABORT;
  };
}
