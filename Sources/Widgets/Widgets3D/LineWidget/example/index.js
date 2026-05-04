import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import '@kitware/vtk.js/Rendering/Profiles/Glyph';

import DeepEqual from 'deep-equal';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkCubeSource from '@kitware/vtk.js/Filters/Sources/CubeSource';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkLineWidget from '@kitware/vtk.js/Widgets/Widgets3D/LineWidget';
import vtkWidgetManager from '@kitware/vtk.js/Widgets/Core/WidgetManager';
import vtkInteractorObserver from '@kitware/vtk.js/Rendering/Core/InteractorObserver';

import { bindSVGRepresentation } from 'vtk.js/Examples/Widgets/Utilities/SVGHelpers';
import GUI from 'lil-gui';

const { computeWorldToDisplay } = vtkInteractorObserver;

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

const cube = vtkCubeSource.newInstance();
const mapper = vtkMapper.newInstance();
const actor = vtkActor.newInstance();

actor.setMapper(mapper);
mapper.setInputConnection(cube.getOutputPort());
actor.getProperty().setOpacity(0.5);

renderer.addActor(actor);

// Store GUI controllers for updating display
const guiControllers = {};

// ----------------------------------------------------------------------------
// Widget manager
// ----------------------------------------------------------------------------

const widgetManager = vtkWidgetManager.newInstance();
widgetManager.setRenderer(renderer);

let widget = null;

let lineWidget = null;
let selectedWidgetIndex = null;

let getHandle = {};

renderer.resetCamera();

const gui = new GUI();
const guiParams = {
  addWidget: () => {},
  removeWidget: () => {},
  handle1Shape: 'sphere',
  handle2Shape: 'sphere',
  linePosition: 50,
  textContent: '',
  distance: 0,
};

gui.add(guiParams, 'addWidget').name('Add widget');
gui.add(guiParams, 'removeWidget').name('Remove widget');

// Distance display
guiControllers.distance = gui
  .add(guiParams, 'distance')
  .name('Distance')
  .disable();

// Text input
guiControllers.textContent = gui
  .add(guiParams, 'textContent')
  .name('Text')
  .onChange((value) => {
    if (lineWidget) {
      lineWidget.setText(value);
      renderWindow.render();
    }
  });

// Line position slider
guiControllers.linePosition = gui
  .add(guiParams, 'linePosition', 0, 100, 1)
  .name('Line position')
  .onChange((value) => {
    const subState = lineWidget?.getWidgetState().getPositionOnLine();
    if (subState) {
      subState.setPosOnLine(value / 100);
      renderWindow.render();
    }
  });

const shapeOptions = {
  Sphere: 'sphere',
  Cone: 'cone',
  Cube: 'cube',
  Triangle: 'triangle',
  '4 points arrow head': '4pointsArrowHead',
  '6 points arrow head': '6pointsArrowHead',
  Star: 'star',
  Disk: 'disk',
  Circle: 'circle',
  'View Finder': 'viewFinder',
  None: 'voidSphere',
};

// Handle Sources ------------------------------------------

function observeDistance() {
  if (!lineWidget) return;

  lineWidget.onInteractionEvent(() => {
    guiParams.distance = widget.getDistance().toFixed(2);
    guiControllers.distance?.updateDisplay?.();
  });

  lineWidget.onEndInteractionEvent(() => {
    guiParams.distance = widget.getDistance().toFixed(2);
    guiControllers.distance?.updateDisplay?.();
  });
}

function updateHandleShape(handleId) {
  let shape;
  if (handleId === 1) {
    shape = guiParams.handle1Shape;
  } else {
    shape = guiParams.handle2Shape;
  }

  const visible = shape !== 'voidSphere';
  const handle = getHandle[handleId];
  if (handle) {
    if (visible) {
      handle.setShape(shape);
    }
    handle.setVisible(visible);
    lineWidget.updateHandleVisibility(handleId - 1);
    lineWidget.getInteractor().render();
  }
}

function setWidgetColor(currentWidget, color) {
  currentWidget.getWidgetState().getHandle1().setColor(color);
  currentWidget.getWidgetState().getHandle2().setColor(color);

  currentWidget.setUseActiveColor(false);
  currentWidget.getWidgetState().getMoveHandle().setColor(0.3);
}

function unselectWidget(index) {
  if (index != null) {
    const widgetToUnselect = widgetManager.getWidgets()[selectedWidgetIndex];
    setWidgetColor(widgetToUnselect, 0.5); // green
  }
  if (index === selectedWidgetIndex) {
    selectedWidgetIndex = null;
  }
}

function selectWidget(index) {
  if (index !== selectedWidgetIndex) {
    unselectWidget(selectedWidgetIndex);
  }
  if (index != null) {
    const widgetToSelect = widgetManager.getWidgets()[index];
    setWidgetColor(widgetToSelect, 0.2); // yellow
  }
  selectedWidgetIndex = index;
}

// Handle 1 controls
guiControllers.handle1Shape = gui
  .add(guiParams, 'handle1Shape', shapeOptions)
  .name('Handle1 shape')
  .onChange(() => updateHandleShape(1));

// Handle 2 controls
guiControllers.handle2Shape = gui
  .add(guiParams, 'handle2Shape', shapeOptions)
  .name('Handle2 shape')
  .onChange(() => updateHandleShape(2));

// -----------------------------------------------------------
// SVG handling
// -----------------------------------------------------------

const svgCleanupCallbacks = [];

function setupSVG(w) {
  svgCleanupCallbacks.push(
    bindSVGRepresentation(renderer, w.getWidgetState(), {
      mapState(widgetState, { size }) {
        const textState = widgetState.getText();
        const text = textState.getText();
        const origin = textState.getOrigin();
        if (origin) {
          const coords = computeWorldToDisplay(renderer, ...origin);
          const position = [coords[0], size[1] - coords[1]];
          return {
            text,
            position,
          };
        }
        return null;
      },
      render(data, h) {
        if (data) {
          return h(
            'text',
            {
              key: 'lineText',
              attrs: {
                x: data.position[0],
                y: data.position[1],
                dx: 12,
                dy: -12,
                fill: 'white',
                'font-size': 32,
              },
            },
            data.text
          );
        }
        return [];
      },
    })
  );
}

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------
guiParams.addWidget = () => {
  widgetManager.releaseFocus(widget);
  const currentWidget = vtkLineWidget.newInstance();
  widget = currentWidget;

  const currentHandle = widgetManager.addWidget(widget);
  lineWidget = currentHandle;

  selectWidget(widgetManager.getWidgets().length - 1);
  setupSVG(widget);

  getHandle = {
    1: lineWidget.getWidgetState().getHandle1(),
    2: lineWidget.getWidgetState().getHandle2(),
  };

  updateHandleShape(1);
  updateHandleShape(2);

  observeDistance();

  widgetManager.grabFocus(widget);

  currentHandle.onStartInteractionEvent(() => {
    const index = widgetManager.getWidgets().findIndex((cwidget) => {
      if (DeepEqual(currentHandle.getWidgetState(), cwidget.getWidgetState()))
        return 1;
      return 0;
    });
    getHandle = {
      1: currentHandle.getWidgetState().getHandle1(),
      2: currentHandle.getWidgetState().getHandle2(),
    };
    selectWidget(index);
    widget = currentWidget;
    lineWidget = currentHandle;
    guiParams.handle1Shape = getHandle[1].getShape() || 'sphere';
    guiParams.handle2Shape = getHandle[2].getShape() || 'sphere';
    guiParams.textContent = lineWidget.getWidgetState().getText().getText();
    // Update GUI controllers to reflect current widget
    Object.values(guiControllers).forEach((controller) =>
      controller.updateDisplay?.()
    );
  });
};
guiParams.removeWidget = () => {
  const widgetIndexToRemove = selectedWidgetIndex;
  unselectWidget(selectedWidgetIndex);
  widgetManager.removeWidget(widgetManager.getWidgets()[widgetIndexToRemove]);
  if (svgCleanupCallbacks.length) {
    svgCleanupCallbacks.splice(widgetIndexToRemove, 1)[0]();
  }
  if (widgetManager.getWidgets().length !== 0) {
    selectWidget(widgetManager.getWidgets().length - 1);
  }
};

// -----------------------------------------------------------
// globals
// -----------------------------------------------------------

global.widget = widget;
global.renderer = renderer;
global.fullScreenRenderer = fullScreenRenderer;
global.renderWindow = renderWindow;
global.widgetManager = widgetManager;
global.line = lineWidget;
