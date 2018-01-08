import macro                                 from 'vtk.js/Sources/macro';
import vtkAbstractWidget                     from 'vtk.js/Sources/Interaction/Widgets/AbstractWidget';
import vtkImageCroppingRegionsRepresentation from 'vtk.js/Sources/Interaction/Widgets/ImageCroppingRegionsRepresentation';
import Constants                             from 'vtk.js/Sources/Interaction/Widgets/ImageCroppingRegionsWidget/Constants';

const { vtkErrorMacro, VOID, EVENT_ABORT } = macro;
const { WidgetState, SliceNormals } = Constants;

const events = [
  'MouseMove',
  'LeftButtonPress',
  'LeftButtonRelease',
  'MiddleButtonPress',
  'MiddleButtonRelease',
  'RightButtonPress',
  'RightButtonRelease',
];

// ----------------------------------------------------------------------------
// vtkImageCroppingRegionsWidget methods
// ----------------------------------------------------------------------------

function vtkImageCroppingRegionsWidget(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkImageCroppingRegionsWidget');

  // private variables
  let widgetState = WidgetState.IDLE;
  let isCropMoving = false;

  // sets cursor based on widget state
  function setCursor(state) {
    switch (state) {
      case WidgetState.MOVE_LEFT:
      case WidgetState.MOVE_RIGHT:
        model.interactor.getView().setCursor('ew-resize');
        break;

      case WidgetState.MOVE_BOTTOM:
      case WidgetState.MOVE_TOP:
        model.interactor.getView().setCursor('ns-resize');
        break;

      case WidgetState.MOVE_LEFT_BOTTOM:
      case WidgetState.MOVE_LEFT_TOP:
      case WidgetState.MOVE_RIGHT_BOTTOM:
      case WidgetState.MOVE_RIGHT_TOP:
        model.interactor.getView().setCursor('all-scroll');
        break;

      case WidgetState.IDLE:
      default:
        model.interactor.getView().setCursor('default');
    }
  }

  // Overriden method
  publicAPI.createDefaultRepresentation = () => {
    if (!model.widgetRep) {
      if (!model.imageMapper) {
        vtkErrorMacro('Widget representation requires an image mapper');
        return;
      }
      model.widgetRep = vtkImageCroppingRegionsRepresentation.newInstance();
      publicAPI.updateRepresentation();
    }
  };

  // Implemented method
  publicAPI.listenEvents = () => {
    if (!model.interactor) {
      vtkErrorMacro('The interactor must be set before listening events');
      return;
    }
    events.forEach((eventName) => {
      model.unsubscribes.push(
      model.interactor[`on${eventName}`](() => {
        if (publicAPI[`handle${eventName}`]) {
          return publicAPI[`handle${eventName}`]();
        }
        return true;
      }, model.priority));
    });
  };

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
      publicAPI.listenEvents();
    }
  };

  publicAPI.setImageMapper = (imageMapper) => {
    if (model.imageMapperUnsubscribe) {
      model.imageMapperUnsubscribe();
      model.imageMapperUnsubscribe = null;
    }

    model.imageMapper = imageMapper;
    model.imageMapperUnsubscribe = imageMapper.onModified(publicAPI.updateSlice);

    if (model.enabled) {
      publicAPI.updateRepresentation();
    }
  };

  publicAPI.updateRepresentation = () => {
    if (!model.imageMapper) {
      vtkErrorMacro('Image mapper must be set to update representation');
      return;
    }

    const bounds = model.imageMapper.getBounds();
    model.widgetRep.placeWidget(...bounds);
    publicAPI.updateSlice();
  };

  publicAPI.updateSlice = () => {
    if (!model.enabled || !model.imageMapper) {
      return;
    }

    const sliceOrientation = model.imageMapper.getCurrentSlicingMode();
    const normal = SliceNormals[sliceOrientation];
    // The + 1 is to put the crop region actor above the current slice
    let slice = model.imageMapper[`get${normal}Slice`]() + 1;

    // transform slice pos
    const data = model.imageMapper.getInputData();
    const origin = data.getOrigin();
    const spacing = data.getSpacing();
    // TODO handle image direction?
    slice = origin[sliceOrientation] + (spacing[sliceOrientation] * slice);

    model.widgetRep.setSlice(slice, sliceOrientation);
  };

  publicAPI.handleLeftButtonPress = () => publicAPI.pressAction();

  publicAPI.handleLeftButtonRelease = () => publicAPI.endMoveAction();

  publicAPI.handleMiddleButtonPress = () => publicAPI.pressAction();

  publicAPI.handleMiddleButtonRelease = () => publicAPI.endMoveAction();

  publicAPI.handleRightButtonPress = () => publicAPI.pressAction();

  publicAPI.handleRightButtonRelease = () => publicAPI.endMoveAction();

  publicAPI.handleMouseMove = () => {
    if (isCropMoving) {
      return publicAPI.moveAction();
    }
    return publicAPI.hoverAction();
  };

  publicAPI.pressAction = () => {
    if (widgetState === WidgetState.IDLE) {
      return VOID;
    }
    isCropMoving = true;
    // prevent low-priority observers from receiving the event
    return EVENT_ABORT;
  };

  publicAPI.hoverAction = () => {
    if (!model.widgetRep) {
      return VOID;
    }

    // Do not change widget state if moving the crop region.
    if (isCropMoving) {
      return VOID;
    }

    const sliceOrientation = model.imageMapper.getCurrentSlicingMode();
    const normal = SliceNormals[sliceOrientation];
    const slice = model.imageMapper[`get${normal}Slice`]();
    const mousePos = publicAPI.get2DPointerPosition();
    const planes = model.widgetRep.getPlanePositions();
    // Assume we should use the first view
    const view = model.interactor.getView();
    const camUp = model.currentRenderer.getActiveCamera().getViewUp();
    // TODO verify camUp is axis-aligned

    let ax1,
      ax2,
      camUp2D;
    switch (sliceOrientation) {
      case 0: // YZ
        ax1 = [planes[2], planes[3]]; // Y crop bounds
        ax2 = [planes[4], planes[5]]; // Z crop bounds
        camUp2D = [camUp[1], camUp[2]];
        break;
      case 1: // ZX
        ax1 = [planes[0], planes[1]]; // X crop bounds
        ax2 = [planes[4], planes[5]]; // Z crop bounds
        // reverse camUp to be -Z, then X
        camUp2D = [-camUp[2], camUp[0]];
        break;
      case 2: // XY
        ax1 = [planes[0], planes[1]]; // X crop bounds
        ax2 = [planes[2], planes[3]]; // Y crop bounds
        camUp2D = [camUp[0], camUp[1]];
        break;
      default:
        vtkErrorMacro('Invalid slice orientation');
        return VOID;
    }

    let leftBottom, // [left, bottom]
      rightTop; // [right, top]

    // handle camera view up
    const camUp2DHash = camUp2D[0] + (10 * camUp2D[1]);
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

    let left,
      bottom,
      right,
      top;

    switch (sliceOrientation) {
      case 0: // YZ
        [left, bottom] = view.worldToDisplay(slice, leftBottom[0], leftBottom[1], model.currentRenderer);
        [right, top] = view.worldToDisplay(slice, rightTop[0], rightTop[1], model.currentRenderer);
        break;
      case 1: // ZX
        [left, bottom] = view.worldToDisplay(leftBottom[0], slice, leftBottom[1], model.currentRenderer);
        [right, top] = view.worldToDisplay(rightTop[0], slice, rightTop[1], model.currentRenderer);
        break;
      case 2: // XY
        [left, bottom] = view.worldToDisplay(leftBottom[0], leftBottom[1], slice, model.currentRenderer);
        [right, top] = view.worldToDisplay(rightTop[0], rightTop[1], slice, model.currentRenderer);
        break;
      default:
        // noop
    }

    const leftDist = Math.abs(left - mousePos[0]);
    const rightDist = Math.abs(right - mousePos[0]);
    const bottomDist = Math.abs(bottom - mousePos[1]);
    const topDist = Math.abs(top - mousePos[1]);

    const tolerance = 3;
    if (leftDist < tolerance) {
      if (bottomDist < tolerance) {
        widgetState = WidgetState.MOVE_LEFT_BOTTOM;
      } else if (topDist < tolerance) {
        widgetState = WidgetState.MOVE_LEFT_TOP;
      } else {
        widgetState = WidgetState.MOVE_LEFT;
      }
    } else if (rightDist < tolerance) {
      if (bottomDist < tolerance) {
        widgetState = WidgetState.MOVE_RIGHT_BOTTOM;
      } else if (topDist < tolerance) {
        widgetState = WidgetState.MOVE_RIGHT_TOP;
      } else {
        widgetState = WidgetState.MOVE_RIGHT;
      }
    } else if (bottomDist < tolerance) {
      widgetState = WidgetState.MOVE_BOTTOM;
    } else if (topDist < tolerance) {
      widgetState = WidgetState.MOVE_TOP;
    } else {
      widgetState = WidgetState.IDLE;
    }

    setCursor(widgetState);
    return VOID;
  };


  publicAPI.moveAction = () => {
    if (widgetState === WidgetState.IDLE) {
      return VOID;
    }

    const mouse = publicAPI.get2DPointerPosition();
    const view = model.interactor.getView();
    const planes = model.widgetRep.getPlanePositions();
    const sliceOrientation = model.imageMapper.getCurrentSlicingMode();
    const bounds = model.widgetRep.getInitialBounds();
    const camUp = model.currentRenderer.getActiveCamera().getViewUp();

    let newPos = view.displayToWorld(...mouse, 0, model.currentRenderer);

    let ax1,
      ax2,
      bounds1,
      bounds2,
      camUp2D;
    switch (sliceOrientation) {
      case 0: // YZ
        ax1 = [planes[2], planes[3]]; // Y crop pos
        ax2 = [planes[4], planes[5]]; // Z crop pos
        bounds1 = [bounds[2], bounds[3]];
        bounds2 = [bounds[4], bounds[5]];
        camUp2D = [camUp[1], camUp[2]];
        newPos = [newPos[1], newPos[2]];
        break;
      case 1: // ZX
        ax1 = [planes[4], planes[5]]; // Z crop pos
        ax2 = [planes[0], planes[1]]; // X crop pos
        bounds1 = [bounds[4], bounds[5]];
        bounds2 = [bounds[0], bounds[1]];
        // reverse camUp and newPos to be Z (not -Z as before), then X
        camUp2D = [camUp[2], camUp[0]];
        newPos = [newPos[2], newPos[0]];
        break;
      case 2: // XY
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

    let left,
      bottom,
      right,
      top;

    // handle camera view up
    const camUp2DHash = camUp2D[0] + (10 * camUp2D[1]);
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
    if (widgetState === WidgetState.MOVE_LEFT
        || widgetState === WidgetState.MOVE_LEFT_TOP
        || widgetState === WidgetState.MOVE_LEFT_BOTTOM) {
      if (left > right) {
        left = Math.max(right + fudge, Math.min(bounds1[1], newPos[0]));
      } else {
        left = Math.max(bounds1[0], Math.min(right, newPos[0]));
      }
    }
    if (widgetState === WidgetState.MOVE_RIGHT
        || widgetState === WidgetState.MOVE_RIGHT_TOP
        || widgetState === WidgetState.MOVE_RIGHT_BOTTOM) {
      if (left > right) {
        right = Math.max(bounds1[0], Math.min(left - fudge, newPos[0]));
      } else {
        right = Math.max(left, Math.min(bounds1[1], newPos[0]));
      }
    }
    if (widgetState === WidgetState.MOVE_BOTTOM
        || widgetState === WidgetState.MOVE_LEFT_BOTTOM
        || widgetState === WidgetState.MOVE_RIGHT_BOTTOM) {
      if (bottom > top) {
        bottom = Math.max(top + fudge, Math.min(bounds2[1], newPos[1]));
      } else {
        bottom = Math.max(bounds2[0], Math.min(top, newPos[1]));
      }
    }
    if (widgetState === WidgetState.MOVE_TOP
        || widgetState === WidgetState.MOVE_LEFT_TOP
        || widgetState === WidgetState.MOVE_RIGHT_TOP) {
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
    switch (sliceOrientation) {
      case 0: // YZ
        [planes[2], planes[3]] = ax1;
        [planes[4], planes[5]] = ax2;
        break;
      case 1: // ZX
        [planes[0], planes[1]] = ax2;
        [planes[4], planes[5]] = ax1;
        break;
      case 2: // XY
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
  // imageMapper: null,
  priority: 0.5, // Use a priority of 0.5, since default priority is 0.0
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  // Have our default values override whatever is from parent class
  vtkAbstractWidget.extend(publicAPI, model, DEFAULT_VALUES, initialValues);

  macro.setGet(publicAPI, model, [
    'imageMapper',
  ]);

  // Object methods
  vtkImageCroppingRegionsWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkImageCroppingRegionsWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
