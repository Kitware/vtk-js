import macro from 'vtk.js/Sources/macros';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkInteractorObserver from 'vtk.js/Sources/Rendering/Core/InteractorObserver';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkPixelSpaceCallbackMapper from 'vtk.js/Sources/Rendering/Core/PixelSpaceCallbackMapper';
import vtkPointSource from 'vtk.js/Sources/Filters/Sources/PointSource';
import vtkHandleRepresentation from 'vtk.js/Sources/Interaction/Widgets/HandleRepresentation';

import {
  TextAlign,
  VerticalAlign,
} from 'vtk.js/Sources/Interaction/Widgets/LabelRepresentation/Constants';
import { InteractionState } from 'vtk.js/Sources/Interaction/Widgets/HandleRepresentation/Constants';

// ----------------------------------------------------------------------------
// vtkLabelRepresentation methods
// ----------------------------------------------------------------------------

function vtkLabelRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkLabelRepresentation');

  const superClass = { ...publicAPI };

  function getCanvasPosition() {
    if (model.canvas) {
      // canvas left/bottom in CSS coords
      const dpr = window.devicePixelRatio;
      return {
        left: Number(model.canvas.style.left.split('px')[0]) * dpr,
        bottom: Number(model.canvas.style.bottom.split('px')[0]) * dpr,
      };
    }
    return null;
  }

  publicAPI.buildRepresentation = () => {
    if (model.labelText !== null) {
      publicAPI.setLabelText(model.labelText);
    }

    publicAPI.modified();
  };

  publicAPI.getActors = () => [model.actor];

  publicAPI.getNestedProps = () => publicAPI.getActors();

  publicAPI.computeInteractionState = (pos) => {
    if (model.canvas) {
      const dpr = window.devicePixelRatio || 1;
      const height = model.canvas.height * dpr;
      const width = model.canvas.width * dpr;

      const canvasPosition = getCanvasPosition();

      // pos is in display coords
      if (
        pos[0] >= canvasPosition.left &&
        pos[0] <= canvasPosition.left + width &&
        pos[1] >= canvasPosition.bottom &&
        pos[1] <= canvasPosition.bottom + height
      ) {
        model.interactionState = InteractionState.SELECTING;
      } else {
        model.interactionState = InteractionState.OUTSIDE;
      }
    }
    return model.interactionState;
  };

  publicAPI.startComplexWidgetInteraction = (startEventPos) => {
    // Record the current event position, and the rectilinear wipe position.
    model.startEventPosition[0] = startEventPos[0];
    model.startEventPosition[1] = startEventPos[1];
    model.startEventPosition[2] = 0.0;

    model.lastEventPosition[0] = startEventPos[0];
    model.lastEventPosition[1] = startEventPos[1];
  };

  publicAPI.complexWidgetInteraction = (eventPos) => {
    if (model.interactionState === InteractionState.SELECTING) {
      const center = model.point.getCenter();
      const displayCenter = vtkInteractorObserver.computeWorldToDisplay(
        model.renderer,
        center[0],
        center[1],
        center[2]
      );
      const focalDepth = displayCenter[2];

      const worldStartEventPosition =
        vtkInteractorObserver.computeDisplayToWorld(
          model.renderer,
          model.lastEventPosition[0],
          model.lastEventPosition[1],
          focalDepth
        );

      const worldCurrentPosition = vtkInteractorObserver.computeDisplayToWorld(
        model.renderer,
        eventPos[0],
        eventPos[1],
        focalDepth
      );

      publicAPI.moveFocus(worldStartEventPosition, worldCurrentPosition);

      model.lastEventPosition[0] = eventPos[0];
      model.lastEventPosition[1] = eventPos[1];

      publicAPI.modified();
    }
  };

  publicAPI.setWorldPosition = (position) => {
    model.point.setCenter(position);
    superClass.setWorldPosition(model.point.getCenter());

    publicAPI.modified();
  };

  publicAPI.setDisplayPosition = (position) => {
    superClass.setDisplayPosition(position);
    publicAPI.setWorldPosition(model.worldPosition.getValue());
  };

  publicAPI.moveFocus = (start, end) => {
    const motionVector = [];
    vtkMath.subtract(end, start, motionVector);

    const focus = model.point.getCenter();
    vtkMath.add(focus, motionVector, focus);

    publicAPI.setWorldPosition(focus);
  };

  publicAPI.getBounds = () => {
    const center = model.point.getCenter();
    const bounds = [];
    bounds[0] = model.placeFactor * (center[0] - 1);
    bounds[1] = model.placeFactor * (center[0] + 1);
    bounds[2] = model.placeFactor * (center[1] - 1);
    bounds[3] = model.placeFactor * (center[1] + 1);
    bounds[4] = model.placeFactor * (center[2] - 1);
    bounds[5] = model.placeFactor * (center[2] + 1);
    return bounds;
  };

  publicAPI.setContainer = (container) => {
    if (model.container && model.container !== container) {
      model.container.removeChild(model.canvas);
    }

    if (model.container !== container) {
      model.container = container;

      if (model.container) {
        model.container.appendChild(model.canvas);
      }

      publicAPI.modified();
    }
  };

  publicAPI.setLabelStyle = (labelStyle) => {
    model.labelStyle = { ...model.labelStyle, ...labelStyle };

    publicAPI.modified();
  };

  publicAPI.setSelectLabelStyle = (selectLabelStyle) => {
    model.selectLabelStyle = {
      ...model.selectLabelStyle,
      ...selectLabelStyle,
    };

    publicAPI.modified();
  };

  publicAPI.computeTextDimensions = (text) => {
    const currentLabelStyle = model.highlight
      ? model.selectLabelStyle
      : model.labelStyle;

    const separatorRegExp = /\r?\n/;
    const separatorRes = separatorRegExp.exec(text);
    const separator = separatorRes !== null ? separatorRes[0] : null;
    const lines = text.split(separator);

    const lineSpace =
      currentLabelStyle.fontSize * (1 + currentLabelStyle.lineSpace);

    const padding = currentLabelStyle.fontSize / 4;

    const height =
      2 * padding + currentLabelStyle.fontSize + (lines.length - 1) * lineSpace;

    const width = lines.reduce(
      (maxWidth, line) =>
        Math.max(maxWidth, Math.round(model.context.measureText(line).width)),
      0
    );

    return { width, height, lineSpace, padding, lines };
  };

  publicAPI.updateLabel = () => {
    if (model.context && model.canvas) {
      // Clear canvas
      model.context.clearRect(0, 0, model.canvas.width, model.canvas.height);
      model.canvas.hidden = !model.actor.getVisibility();

      // Render text
      if (model.actor.getVisibility()) {
        const currentLabelStyle = model.highlight
          ? model.selectLabelStyle
          : model.labelStyle;

        const { width, height, lineSpace, padding, lines } =
          publicAPI.computeTextDimensions(model.labelText);

        model.canvas.height = Math.round(height);
        model.canvas.width = width + 2 * padding;

        // Update label style
        model.context.strokeStyle = currentLabelStyle.strokeColor;
        model.context.lineWidth = currentLabelStyle.strokeSize;
        model.context.fillStyle = currentLabelStyle.fontColor;
        model.context.font = `${currentLabelStyle.fontStyle} ${currentLabelStyle.fontSize}px ${currentLabelStyle.fontFamily}`;

        // Update canvas dimensions
        const x = padding;
        let y = currentLabelStyle.fontSize;

        // Add text
        lines.forEach((line) => {
          let offset = 0;
          if (model.textAlign === TextAlign.RIGHT) {
            offset = width - Math.round(model.context.measureText(line).width);
          } else if (model.textAlign === TextAlign.CENTER) {
            offset =
              0.5 * (width - Math.round(model.context.measureText(line).width));
          }
          model.context.strokeText(line, x + offset, y);
          model.context.fillText(line, x + offset, y);
          y += lineSpace;
        });
      }
    }
  };

  publicAPI.highlight = (highlight) => {
    model.highlight = highlight;
    publicAPI.modified();
  };

  publicAPI.getCanvasSize = () => {
    if (model.canvas) {
      return {
        height: model.canvas.height,
        width: model.canvas.width,
      };
    }
    return null;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

function defaultValues(initialValues) {
  return {
    container: null,
    labelStyle: {
      fontColor: 'white',
      fontStyle: 'normal',
      fontSize: 15,
      fontFamily: 'Arial',
      strokeColor: 'black',
      strokeSize: 1,
      lineSpace: 0.2,
    },
    labelText: '',
    textAlign: TextAlign.LEFT,
    verticalAlign: VerticalAlign.BOTTOM,
    selectLabelStyle: {
      fontColor: 'rgb(0, 255, 0)',
      fontStyle: 'normal',
      fontSize: 15,
      fontFamily: 'Arial',
      strokeColor: 'black',
      strokeSize: 1,
      lineSpace: 0.2,
    },
    ...initialValues,
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, defaultValues(initialValues));

  // Inheritance
  vtkHandleRepresentation.extend(publicAPI, model, initialValues);

  publicAPI.setPlaceFactor(1);

  // Canvas
  model.canvas = document.createElement('canvas');
  model.canvas.style.position = 'absolute';

  // Context
  model.context = model.canvas.getContext('2d');

  // PixelSpaceCallbackMapper
  model.point = vtkPointSource.newInstance();
  model.point.setNumberOfPoints(1);
  model.point.setRadius(0);

  model.mapper = vtkPixelSpaceCallbackMapper.newInstance();
  model.mapper.setInputConnection(model.point.getOutputPort());
  model.mapper.setCallback((coordList) => {
    if (model.canvas) {
      let yOffset = 0;

      if (model.verticalAlign === VerticalAlign.BOTTOM) {
        yOffset = -model.canvas.height;
      } else if (model.verticalAlign === VerticalAlign.CENTER) {
        yOffset = -0.5 * model.canvas.height;
      }

      // coordList[0] is in display coords
      const dpr = window.devicePixelRatio;
      model.canvas.style.left = `${Math.round(coordList[0][0]) / dpr}px`;
      model.canvas.style.bottom = `${Math.round(
        coordList[0][1] / dpr + yOffset
      )}px`;

      publicAPI.modified();
    }
  });

  model.actor = vtkActor.newInstance({ parentProp: publicAPI });
  model.actor.setMapper(model.mapper);
  model.actorVisibility = true;

  model.highlight = false;

  model.actor.onModified(() => {
    if (model.actorVisibility !== model.actor.getVisibility()) {
      model.actorVisibility = model.actor.getVisibility();

      publicAPI.modified();
    }
  });

  publicAPI.onModified(() => {
    publicAPI.updateLabel();
  });

  macro.setGet(publicAPI, model, ['labelText', 'textAlign', 'verticalAlign']);
  macro.get(publicAPI, model, ['container', 'labelStyle']);

  // Object methods
  vtkLabelRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkLabelRepresentation');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
