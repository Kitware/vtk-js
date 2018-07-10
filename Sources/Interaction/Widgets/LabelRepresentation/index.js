import macro from 'vtk.js/Sources/macro';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkInteractorObserver from 'vtk.js/Sources/Rendering/Core/InteractorObserver';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkPixelSpaceCallbackMapper from 'vtk.js/Sources/Rendering/Core/PixelSpaceCallbackMapper';
import vtkPointSource from 'vtk.js/Sources/Filters/Sources/PointSource';
import vtkHandleRepresentation from 'vtk.js/Sources/Interaction/Widgets/HandleRepresentation';

import { InteractionState } from 'vtk.js/Sources/Interaction/Widgets/HandleRepresentation/Constants';

// ----------------------------------------------------------------------------
// vtkLabelRepresentation methods
// ----------------------------------------------------------------------------

function vtkLabelRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkLabelRepresentation');

  const superClass = Object.assign({}, publicAPI);

  publicAPI.buildRepresentation = () => {
    if (model.labelText !== null) {
      publicAPI.setLabelText(model.labelText);
    }

    publicAPI.modified();
  };

  publicAPI.getActors = () => model.actor;

  publicAPI.getNestedProps = () => publicAPI.getActors();

  publicAPI.computeInteractionState = (pos) => {
    if (model.canvas) {
      const height = model.canvas.height;
      const width = model.canvas.width;

      if (
        pos[0] >= model.canvasPosition.left &&
        pos[0] <= model.canvasPosition.left + width &&
        pos[1] >= model.canvasPosition.bottom &&
        pos[1] <= model.canvasPosition.bottom + height
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

      const worldStartEventPosition = vtkInteractorObserver.computeDisplayToWorld(
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

  publicAPI.setLabelVisibility = (visible) => {
    model.canvas.style.visibility = visible ? 'visible' : 'hidden';

    publicAPI.updateLabel();
    publicAPI.modified();
  };

  publicAPI.setLabelText = (labelText) => {
    model.labelText = labelText;

    publicAPI.updateLabel();
    publicAPI.modified();
  };

  publicAPI.setLabelPosition = (position) => {
    // Display text
    if (model.canvas) {
      model.canvas.style.left = `${position[0]}px`;
      model.canvas.style.bottom = `${position[1]}px`;

      publicAPI.modified();
    }
  };

  publicAPI.setLabelStyle = (labelStyle) => {
    model.labelStyle = Object.assign({}, model.labelStyle, labelStyle);

    publicAPI.updateLabel();
    publicAPI.modified();
  };

  publicAPI.setSelectLabelStyle = (selectLabelStyle) => {
    model.selectLabelStyle = Object.assign(
      {},
      model.selectLabelStyle,
      selectLabelStyle
    );

    publicAPI.updateLabel();
    publicAPI.modified();
  };

  publicAPI.updateLabel = () => {
    if (model.context && model.canvas) {
      // Clear canvas
      model.context.clearRect(0, 0, model.canvas.width, model.canvas.height);

      // Render text
      if (model.labelVisibility) {
        const currentLabelStyle = model.higlight
          ? model.selectLabelStyle
          : model.labelStyle;

        const lines = model.labelText.split('\n ');

        const lineSpace =
          currentLabelStyle.fontSize * (1 + currentLabelStyle.lineSpace);

        const padding = currentLabelStyle.fontSize / 4;

        const height =
          2 * padding +
          currentLabelStyle.fontSize +
          (lines.length - 1) * lineSpace;

        let maxWidth = 0;
        lines.forEach((line) => {
          const width = Math.round(model.context.measureText(line).width);

          if (width > maxWidth) {
            maxWidth = width;
          }
        });

        model.canvas.height = Math.round(height);
        model.canvas.width = maxWidth + 2 * padding;

        // Update label style
        model.context.strokeStyle = currentLabelStyle.strokeColor;
        model.context.lineWidth = currentLabelStyle.strokeSize;
        model.context.fillStyle = currentLabelStyle.fontColor;
        model.context.font = `${currentLabelStyle.fontStyle} ${
          currentLabelStyle.fontSize
        }px ${currentLabelStyle.fontFamily}`;

        // Update canvas dimensions
        const x = padding;
        let y = currentLabelStyle.fontSize;

        // Add text
        lines.forEach((line) => {
          model.context.strokeText(line, x, y);
          model.context.fillText(line, x, y);
          y += lineSpace;
        });
      }
    }
  };

  publicAPI.highlight = (highlight) => {
    model.higlight = highlight;

    publicAPI.updateLabel();
    publicAPI.modified();
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
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
  labelVisibility: true,
  selectLabelStyle: {
    fontColor: 'rgb(0, 255, 0)',
    fontStyle: 'normal',
    fontSize: 15,
    fontFamily: 'Arial',
    strokeColor: 'black',
    strokeSize: 1,
    lineSpace: 0.2,
  },
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkHandleRepresentation.extend(publicAPI, model, initialValues);

  publicAPI.setPlaceFactor(1);

  // Canvas
  model.canvas = document.createElement('canvas');
  model.canvas.style.position = 'absolute';
  model.canvasPosition = {
    bottom: 0,
    left: 0,
  };

  // Context
  model.context = model.canvas.getContext('2d');

  model.point = vtkPointSource.newInstance();
  model.point.setNumberOfPoints(1);
  model.point.setRadius(0);

  model.mapper = vtkPixelSpaceCallbackMapper.newInstance();
  model.mapper.setInputConnection(model.point.getOutputPort());
  model.mapper.setUseZValues(true);
  model.mapper.setCallback((coordList) => {
    model.canvasPosition.left = coordList[0][0];
    model.canvasPosition.bottom = coordList[0][1];

    publicAPI.setLabelPosition(coordList[0]);
  });

  model.actor = vtkActor.newInstance();
  model.actor.setMapper(model.mapper);

  model.higlight = false;

  macro.get(publicAPI, model, [
    'container',
    'labelText',
    'labelVisibility',
    'labelStyle',
  ]);

  // Object methods
  vtkLabelRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkLabelRepresentation');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
