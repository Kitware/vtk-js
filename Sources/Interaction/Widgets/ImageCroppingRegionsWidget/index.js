import macro from 'vtk.js/Sources/macro';
import vtkAbstractWidget from 'vtk.js/Sources/Interaction/Widgets/AbstractWidget';
import vtkImageCroppingRegionsRepresentation from 'vtk.js/Sources/Interaction/Widgets/ImageCroppingRegionsRepresentation';
import Constants from 'vtk.js/Sources/Interaction/Widgets/ImageCroppingRegionsWidget/Constants';

const { vtkErrorMacro, VOID, EVENT_ABORT } = macro;
const { WidgetState, CropWidgetEvents, Orientation } = Constants;

// ----------------------------------------------------------------------------
// vtkImageCroppingRegionsWidget methods
// ----------------------------------------------------------------------------

// Returns cursor name based on widget state
function getCursorState(state) {
  switch (state) {
    case WidgetState.MOVE_LEFT:
    case WidgetState.MOVE_RIGHT:
      return 'ew-resize';

    case WidgetState.MOVE_BOTTOM:
    case WidgetState.MOVE_TOP:
      return 'ns-resize';

    case WidgetState.MOVE_LEFT_BOTTOM:
    case WidgetState.MOVE_LEFT_TOP:
    case WidgetState.MOVE_RIGHT_BOTTOM:
    case WidgetState.MOVE_RIGHT_TOP:
      return 'all-scroll';

    case WidgetState.IDLE:
    default:
      return 'default';
  }
}

function vtkImageCroppingRegionsWidget(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkImageCroppingRegionsWidget');

  // private variables
  let widgetState = WidgetState.IDLE;
  let isCropMoving = false;

  // Overriden method
  publicAPI.createDefaultRepresentation = () => {
    if (!model.widgetRep) {
      model.widgetRep = vtkImageCroppingRegionsRepresentation.newInstance();

      model.widgetRep.onPlanesPositionChanged(
        publicAPI.invokeCroppingPlanesPositionChanged
      );

      publicAPI.updateRepresentation();
    }
  };

  publicAPI.setVolumeMapper = (volumeMapper) => {
    if (volumeMapper !== model.volumeMapper) {
      model.volumeMapper = volumeMapper;
      if (model.enabled) {
        publicAPI.updateRepresentation();
      }
    }
  };

  publicAPI.updateRepresentation = () => {
    if (!model.volumeMapper) {
      vtkErrorMacro('Volume mapper must be set to update representation');
      return;
    }
    if (!model.volumeMapper.getInputData()) {
      vtkErrorMacro('Volume mapper has no input data');
      return;
    }

    const bounds = model.volumeMapper.getBounds();

    model.widgetRep.placeWidget(...bounds);
    publicAPI.updateWidget();
  };

  // Force a widget update
  publicAPI.updateWidget = () => {
    const data = model.volumeMapper.getInputData();
    const origin = data.getOrigin();
    const spacing = data.getSpacing();
    const slice =
      origin[model.sliceOrientation] +
      spacing[model.sliceOrientation] * model.slice;

    model.widgetRep.setSliceOrientation(model.sliceOrientation);
    // set the widget representation slice + 1 to prevent z fighting
    model.widgetRep.setSlice(slice + 1);

    publicAPI.modified();
  };

  publicAPI.setSlice = (slice) => {
    if (slice !== model.slice) {
      model.slice = slice;
      if (model.enabled) {
        publicAPI.updateWidget();
      }
    }
  };

  publicAPI.setSliceOrientation = (sliceOrientation) => {
    if (sliceOrientation !== model.sliceOrientation) {
      model.sliceOrientation = sliceOrientation;
      if (model.enabled) {
        publicAPI.updateWidget();
      }
    }
  };

  publicAPI.handleLeftButtonPress = (callData) =>
    publicAPI.pressAction(callData);

  publicAPI.handleLeftButtonRelease = (callData) =>
    publicAPI.endMoveAction(callData);

  publicAPI.handleMiddleButtonPress = (callData) =>
    publicAPI.pressAction(callData);

  publicAPI.handleMiddleButtonRelease = (callData) =>
    publicAPI.endMoveAction(callData);

  publicAPI.handleRightButtonPress = (callData) =>
    publicAPI.pressAction(callData);

  publicAPI.handleRightButtonRelease = (callData) =>
    publicAPI.endMoveAction(callData);

  publicAPI.handleMouseMove = (callData) => {
    if (isCropMoving) {
      return publicAPI.moveAction(callData);
    }
    return publicAPI.hoverAction(callData);
  };

  publicAPI.pressAction = (callData) => {
    if (widgetState === WidgetState.IDLE) {
      return VOID;
    }
    isCropMoving = true;
    // prevent low-priority observers from receiving the event
    return EVENT_ABORT;
  };

  publicAPI.hoverAction = (callData) => {
    if (!model.widgetRep) {
      return VOID;
    }

    // Do not change widget state if moving the crop region.
    if (isCropMoving) {
      return VOID;
    }

    const mousePos = [callData.position.x, callData.position.y];
    const planes = model.widgetRep.getPlanePositions();
    // Assume we should use the first view
    const view = model.interactor.getView();
    const camUp = callData.pokedRenderer.getActiveCamera().getViewUp();

    let ax1;
    let ax2;
    let camUp2D;

    switch (model.sliceOrientation) {
      case Orientation.YZ:
        ax1 = [planes[2], planes[3]]; // Y crop bounds
        ax2 = [planes[4], planes[5]]; // Z crop bounds
        camUp2D = [camUp[1], camUp[2]];
        break;
      case Orientation.XZ: // ZX
        ax1 = [planes[0], planes[1]]; // X crop bounds
        ax2 = [planes[4], planes[5]]; // Z crop bounds
        // reverse camUp to be -Z, then X
        camUp2D = [-camUp[2], camUp[0]];
        break;
      case Orientation.XY:
        ax1 = [planes[0], planes[1]]; // X crop bounds
        ax2 = [planes[2], planes[3]]; // Y crop bounds
        camUp2D = [camUp[0], camUp[1]];
        break;
      default:
        vtkErrorMacro('Invalid slice orientation');
        return VOID;
    }

    let leftBottom; // [left, bottom]
    let rightTop; // [right, top]

    // handle camera view up
    const camUp2DHash = camUp2D[0] + 10 * camUp2D[1];
    switch (camUp2DHash) {
      case 1: // [1, 0]
        leftBottom = [ax1[0], ax2[1]];
        rightTop = [ax1[1], ax2[0]];
        break;
      case -1: // [-1, 0]
        leftBottom = [ax1[1], ax2[0]];
        rightTop = [ax1[0], ax2[1]];
        break;
      case 10: // [0, 1]
        leftBottom = [ax1[0], ax2[0]];
        rightTop = [ax1[1], ax2[1]];
        break;
      case -10: // [0, -1]
        leftBottom = [ax1[1], ax2[1]];
        rightTop = [ax1[0], ax2[0]];
        break;
      default:
        vtkErrorMacro('Invalid camera view-up');
        return VOID;
    }

    let left;
    let bottom;
    let right;
    let top;

    switch (model.sliceOrientation) {
      case Orientation.YZ:
        [left, bottom] = view.worldToDisplay(
          model.slice,
          leftBottom[0],
          leftBottom[1],
          callData.pokedRenderer
        );
        [right, top] = view.worldToDisplay(
          model.slice,
          rightTop[0],
          rightTop[1],
          callData.pokedRenderer
        );
        break;
      case Orientation.XZ: // ZX
        [left, bottom] = view.worldToDisplay(
          leftBottom[0],
          model.slice,
          leftBottom[1],
          callData.pokedRenderer
        );
        [right, top] = view.worldToDisplay(
          rightTop[0],
          model.slice,
          rightTop[1],
          callData.pokedRenderer
        );
        break;
      case Orientation.XY:
        [left, bottom] = view.worldToDisplay(
          leftBottom[0],
          leftBottom[1],
          model.slice,
          callData.pokedRenderer
        );
        [right, top] = view.worldToDisplay(
          rightTop[0],
          rightTop[1],
          model.slice,
          callData.pokedRenderer
        );
        break;
      default:
      // noop
    }

    const leftDist = Math.abs(left - mousePos[0]);
    const rightDist = Math.abs(right - mousePos[0]);
    const bottomDist = Math.abs(bottom - mousePos[1]);
    const topDist = Math.abs(top - mousePos[1]);

    if (leftDist < model.handleSize) {
      if (bottomDist < model.handleSize) {
        widgetState = WidgetState.MOVE_LEFT_BOTTOM;
      } else if (topDist < model.handleSize) {
        widgetState = WidgetState.MOVE_LEFT_TOP;
      } else {
        widgetState = WidgetState.MOVE_LEFT;
      }
    } else if (rightDist < model.handleSize) {
      if (bottomDist < model.handleSize) {
        widgetState = WidgetState.MOVE_RIGHT_BOTTOM;
      } else if (topDist < model.handleSize) {
        widgetState = WidgetState.MOVE_RIGHT_TOP;
      } else {
        widgetState = WidgetState.MOVE_RIGHT;
      }
    } else if (bottomDist < model.handleSize) {
      widgetState = WidgetState.MOVE_BOTTOM;
    } else if (topDist < model.handleSize) {
      widgetState = WidgetState.MOVE_TOP;
    } else {
      widgetState = WidgetState.IDLE;
    }

    model.interactor.getView().setCursor(getCursorState(widgetState));
    return VOID;
  };

  publicAPI.moveAction = (callData) => {
    if (widgetState === WidgetState.IDLE) {
      return VOID;
    }

    const mouse = [callData.position.x, callData.position.y];
    const view = model.interactor.getView();
    const planes = model.widgetRep.getPlanePositions();
    const bounds = model.widgetRep.getInitialBounds();
    const camUp = callData.pokedRenderer.getActiveCamera().getViewUp();

    let newPos = view.displayToWorld(...mouse, 0, callData.pokedRenderer);

    let ax1;
    let ax2;
    let bounds1;
    let bounds2;
    let camUp2D;

    switch (model.sliceOrientation) {
      case Orientation.YZ:
        ax1 = [planes[2], planes[3]]; // Y crop pos
        ax2 = [planes[4], planes[5]]; // Z crop pos
        bounds1 = [bounds[2], bounds[3]];
        bounds2 = [bounds[4], bounds[5]];
        camUp2D = [camUp[1], camUp[2]];
        newPos = [newPos[1], newPos[2]];
        break;
      case Orientation.XZ: // ZX
        ax1 = [planes[4], planes[5]]; // Z crop pos
        ax2 = [planes[0], planes[1]]; // X crop pos
        bounds1 = [bounds[4], bounds[5]];
        bounds2 = [bounds[0], bounds[1]];
        // reverse camUp and newPos to be Z (not -Z as before), then X
        camUp2D = [camUp[2], camUp[0]];
        newPos = [newPos[2], newPos[0]];
        break;
      case Orientation.XY:
        ax1 = [planes[0], planes[1]]; // X crop pos
        ax2 = [planes[2], planes[3]]; // Y crop pos
        bounds1 = [bounds[0], bounds[1]];
        bounds2 = [bounds[2], bounds[3]];
        camUp2D = [camUp[0], camUp[1]];
        newPos = [newPos[0], newPos[1]];
        break;
      default:
        vtkErrorMacro('Invalid slice orientation');
        return VOID;
    }

    let left;
    let bottom;
    let right;
    let top;

    // handle camera view up
    const camUp2DHash = camUp2D[0] + 10 * camUp2D[1];
    switch (camUp2DHash) {
      case 1: // [1, 0]
        [left, bottom, right, top] = [ax2[1], ax1[0], ax2[0], ax1[1]];
        // swap axes
        newPos = [newPos[1], newPos[0]];
        [bounds1, bounds2] = [bounds2, bounds1];
        break;
      case -1: // [-1, 0]
        [left, bottom, right, top] = [ax2[0], ax1[1], ax2[1], ax1[0]];
        // swap axes
        newPos = [newPos[1], newPos[0]];
        [bounds1, bounds2] = [bounds2, bounds1];
        break;
      case 10: // [0, 1]
        [left, bottom, right, top] = [ax1[0], ax2[0], ax1[1], ax2[1]];
        break;
      case -10: // [0, -1]
        [left, bottom, right, top] = [ax1[1], ax2[1], ax1[0], ax2[0]];
        break;
      default:
        vtkErrorMacro('Invalid camera view-up');
        return VOID;
    }

    // Is there a better way than using a fudge factor?
    const fudge = 1e-12;
    if (
      widgetState === WidgetState.MOVE_LEFT ||
      widgetState === WidgetState.MOVE_LEFT_TOP ||
      widgetState === WidgetState.MOVE_LEFT_BOTTOM
    ) {
      if (left > right) {
        left = Math.max(right + fudge, Math.min(bounds1[1], newPos[0]));
      } else {
        left = Math.max(bounds1[0], Math.min(right, newPos[0]));
      }
    }
    if (
      widgetState === WidgetState.MOVE_RIGHT ||
      widgetState === WidgetState.MOVE_RIGHT_TOP ||
      widgetState === WidgetState.MOVE_RIGHT_BOTTOM
    ) {
      if (left > right) {
        right = Math.max(bounds1[0], Math.min(left - fudge, newPos[0]));
      } else {
        right = Math.max(left, Math.min(bounds1[1], newPos[0]));
      }
    }
    if (
      widgetState === WidgetState.MOVE_BOTTOM ||
      widgetState === WidgetState.MOVE_LEFT_BOTTOM ||
      widgetState === WidgetState.MOVE_RIGHT_BOTTOM
    ) {
      if (bottom > top) {
        bottom = Math.max(top + fudge, Math.min(bounds2[1], newPos[1]));
      } else {
        bottom = Math.max(bounds2[0], Math.min(top, newPos[1]));
      }
    }
    if (
      widgetState === WidgetState.MOVE_TOP ||
      widgetState === WidgetState.MOVE_LEFT_TOP ||
      widgetState === WidgetState.MOVE_RIGHT_TOP
    ) {
      if (bottom > top) {
        top = Math.max(bounds2[0], Math.min(bottom - fudge, newPos[1]));
      } else {
        top = Math.max(bottom, Math.min(bounds2[1], newPos[1]));
      }
    }

    // revert cam view up transform
    switch (camUp2DHash) {
      case 1: // [1, 0]
        [ax2[1], ax1[0], ax2[0], ax1[1]] = [left, bottom, right, top];
        break;
      case -1: // [-1, 0]
        [ax2[0], ax1[1], ax2[1], ax1[0]] = [left, bottom, right, top];
        break;
      case 10: // [0, 1]
        [ax1[0], ax2[0], ax1[1], ax2[1]] = [left, bottom, right, top];
        break;
      case -10: // [0, -1]
        [ax1[1], ax2[1], ax1[0], ax2[0]] = [left, bottom, right, top];
        break;
      default:
        vtkErrorMacro('Invalid camera view-up');
        return VOID;
    }

    // assign new plane values
    switch (model.sliceOrientation) {
      case Orientation.YZ:
        [planes[2], planes[3]] = ax1;
        [planes[4], planes[5]] = ax2;
        break;
      case Orientation.XZ: // ZX
        [planes[0], planes[1]] = ax2;
        [planes[4], planes[5]] = ax1;
        break;
      case Orientation.XY:
        [planes[0], planes[1]] = ax1;
        [planes[2], planes[3]] = ax2;
        break;
      default:
        vtkErrorMacro('Invalid slice orientation');
        return VOID;
    }

    model.widgetRep.setPlanePositions(...planes);
    model.interactor.render();

    return EVENT_ABORT;
  };

  publicAPI.endMoveAction = () => {
    isCropMoving = false;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // volumeMapper: null,
  slice: 0,
  sliceOrientation: 2, // XY
  handleSize: 3,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  // Have our default values override whatever is from parent class
  vtkAbstractWidget.extend(publicAPI, model, DEFAULT_VALUES, initialValues);

  CropWidgetEvents.forEach((eventName) =>
    macro.event(publicAPI, model, eventName)
  );

  macro.setGet(publicAPI, model, ['handleSize']);
  macro.get(publicAPI, model, ['volumeMapper', 'slice', 'sliceOrientation']);

  // Object methods
  vtkImageCroppingRegionsWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkImageCroppingRegionsWidget'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
