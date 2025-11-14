/* eslint-disable no-unused-expressions */
import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import '@kitware/vtk.js/Rendering/Profiles/Glyph';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkInteractorStyleImage from '@kitware/vtk.js/Interaction/Style/InteractorStyleImage';

import vtkWidgetManager from '@kitware/vtk.js/Widgets/Core/WidgetManager';
import vtkLabelWidget from '@kitware/vtk.js/Widgets/Widgets3D/LabelWidget';

import vtkInteractorObserver from '@kitware/vtk.js/Rendering/Core/InteractorObserver';
import {
  bindSVGRepresentation,
  multiLineTextCalculator,
  VerticalTextAlignment,
  makeListenableSVGNode,
} from 'vtk.js/Examples/Widgets/Utilities/SVGHelpers';

import GUI from 'lil-gui';

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

let guiParams;
const guiControllers = [];
const gui = new GUI();

let currentHandle = null;
const svgCleanupCallbacks = new Map();

function selectHandle(handle, textProps) {
  currentHandle = handle;
  guiParams.Text = currentHandle.getText() || '';
  guiParams.FontSize = textProps.fontSize;
  guiParams.FontColor = textProps.fontColor;
  guiControllers.forEach((c) => c.updateDisplay?.());
}

guiParams = {
  Text: '',
  FontSize: 32,
  FontColor: '#ffffff',
  AddLabel() {
    const widget = vtkLabelWidget.newInstance();
    const handle = widgetManager.addWidget(widget);
    widgetManager.grabFocus(widget);

    const textProps = {
      fontSize: 32,
      fontColor: '#ffffff',
    };
    handleTextProps.set(handle, textProps);
    svgCleanupCallbacks.set(handle, setupSVG(handle));

    handle.onStartInteractionEvent(() => {
      selectHandle(handle, handleTextProps.get(handle));
    });

    selectHandle(handle, textProps);
  },
  DeleteLabel() {
    if (currentHandle) {
      currentHandle.reset();
      widgetManager.removeWidget(currentHandle);
      const cleanup = svgCleanupCallbacks.get(currentHandle);
      cleanup && cleanup();
      svgCleanupCallbacks.delete(currentHandle);
      handleTextProps.delete(currentHandle);
      currentHandle = null;
    }
  },
};

guiControllers.push(
  gui
    .add(guiParams, 'Text')
    .name('Text')
    .onChange((value) => {
      if (currentHandle) {
        currentHandle.setText(value);
        renderWindow.render();
      }
    })
);

guiControllers.push(
  gui
    .add(guiParams, 'FontSize', 8, 128, 1)
    .name('Font size')
    .onChange((value) => {
      if (currentHandle) {
        const props = handleTextProps.get(currentHandle) || {
          fontColor: guiParams.FontColor,
        };
        handleTextProps.set(currentHandle, {
          ...props,
          fontSize: value,
        });
        currentHandle.getWidgetState().modified(); // render svg
      }
    })
);

guiControllers.push(
  gui
    .addColor(guiParams, 'FontColor')
    .name('Font color')
    .onChange((value) => {
      if (currentHandle) {
        const props = handleTextProps.get(currentHandle) || {
          fontSize: guiParams.FontSize,
        };
        handleTextProps.set(currentHandle, {
          ...props,
          fontColor: value,
        });
        currentHandle.getWidgetState().modified(); // render svg
      }
    })
);

gui.add(guiParams, 'AddLabel').name('Add label');
gui.add(guiParams, 'DeleteLabel').name('Delete label');
