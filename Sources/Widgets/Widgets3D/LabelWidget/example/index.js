import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import '@kitware/vtk.js/Rendering/Profiles/Glyph';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkInteractorStyleImage from '@kitware/vtk.js/Interaction/Style/InteractorStyleImage';

import vtkWidgetManager from '@kitware/vtk.js/Widgets/Core/WidgetManager';
import vtkLabelWidget from '@kitware/vtk.js/Widgets/Widgets3D/LabelWidget';

import vtkInteractorObserver from 'vtk.js/Sources/Rendering/Core/InteractorObserver';
import {
  bindSVGRepresentation,
  multiLineTextCalculator,
  VerticalTextAlignment,
  makeListenableSVGNode,
} from 'vtk.js/Examples/Widgets/Utilities/SVGHelpers';

import controlPanel from './controlPanel.html';

const { computeWorldToDisplay } = vtkInteractorObserver;

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
const iStyle = vtkInteractorStyleImage.newInstance();
renderWindow.getInteractor().setInteractorStyle(iStyle);

const widgetManager = vtkWidgetManager.newInstance();
widgetManager.setRenderer(renderer);

renderer.resetCamera();
widgetManager.enablePicking();

// ----------------------------------------------------------------------------
// SVG
// ----------------------------------------------------------------------------

const handleTextProps = new Map();

function setupSVG(viewWidget) {
  bindSVGRepresentation(renderer, viewWidget.getWidgetState(), {
    mapState(widgetState, { size }) {
      const textState = widgetState.getText();
      const text = textState.getText();
      const origin = textState.getOrigin();
      if (origin && textState.getVisible()) {
        const coords = computeWorldToDisplay(renderer, ...origin);
        const position = [coords[0], size[1] - coords[1]];
        return {
          text,
          position,
          active: textState.getActive(),
        };
      }
      return null;
    },
    render(data, h) {
      if (data) {
        const nodes = [];
        const { text, position, active } = data;
        const { fontColor, fontSize } = handleTextProps.get(viewWidget);

        if (text.trim().length === 0) {
          nodes.push(
            h('circle', {
              key: 'circle',
              attrs: {
                r: 5,
                stroke: 'red',
                fill: 'red',
                cx: position[0],
                cy: position[1],
              },
            })
          );
        }

        const lines = text.split('\n');
        const dys = multiLineTextCalculator(
          lines.length,
          fontSize,
          VerticalTextAlignment.MIDDLE
        );
        nodes.push(
          ...lines.map((line, index) =>
            makeListenableSVGNode(
              h(
                'text',
                {
                  key: index,
                  attrs: {
                    x: position[0],
                    y: position[1],
                    dx: 12,
                    dy: dys[index],
                    fill: fontColor,
                    'font-size': fontSize,
                    'text-anchor': 'middle',
                    'font-weight': active ? 'bold' : 'normal',
                  },
                  style: {
                    cursor: 'pointer',
                  },
                  on: {
                    pointerenter() {
                      widgetManager.disablePicking();
                      viewWidget.activateHandle({
                        selectedState: viewWidget.getWidgetState().getText(),
                      });
                    },
                    pointerleave: () => {
                      viewWidget.deactivateAllHandles();
                      widgetManager.enablePicking();
                    },
                  },
                },
                line
              )
            )
          )
        );

        return nodes;
      }
      return [];
    },
  });
}

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);

let currentHandle = null;
const svgCleanupCallbacks = new Map();

// Add a new label
document.querySelector('#addLabel').addEventListener('click', () => {
  const widget = vtkLabelWidget.newInstance();
  const handle = widgetManager.addWidget(widget);
  widgetManager.grabFocus(widget);

  const textProps = {
    fontSize: 32,
    fontColor: 'white',
  };
  handleTextProps.set(handle, textProps);
  svgCleanupCallbacks.set(handle, setupSVG(handle));

  // Update control panel when a label is selected
  handle.onStartInteractionEvent(() => {
    currentHandle = handle;
    document.getElementById('txtIpt').value = currentHandle.getText() || '';
    document.getElementById('fontSize').value = textProps.fontSize;
    document.getElementById('color').value = textProps.fontColor;
  });
});

// Delete a label
document.querySelector('#deleteLabel').addEventListener('click', () => {
  if (currentHandle) {
    currentHandle.reset();
    widgetManager.removeWidget(currentHandle);
    svgCleanupCallbacks.get(currentHandle)();
    svgCleanupCallbacks.delete(currentHandle);
    handleTextProps.delete(currentHandle);
    currentHandle = null;
  }
});

// Update text
function updateText() {
  const input = document.getElementById('txtIpt').value;
  if (currentHandle) {
    currentHandle.setText(input);
    renderWindow.render();
  }
}
document.querySelector('#txtIpt').addEventListener('keyup', updateText);

// Update font size
function updateFontSize() {
  const input = document.getElementById('fontSize').value;
  if (currentHandle) {
    handleTextProps.set(currentHandle, {
      ...handleTextProps.get(currentHandle),
      fontSize: input,
    });
    currentHandle.getWidgetState().modified(); // render svg
  }
}
document.querySelector('#fontSize').addEventListener('input', updateFontSize);

// Update color
function updateColor() {
  const input = document.getElementById('color').value;
  if (currentHandle) {
    handleTextProps.set(currentHandle, {
      ...handleTextProps.get(currentHandle),
      fontColor: input,
    });
    currentHandle.getWidgetState().modified(); // render svg
  }
}
document.querySelector('#color').addEventListener('input', updateColor);
