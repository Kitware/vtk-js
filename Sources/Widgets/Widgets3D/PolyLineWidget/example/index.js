import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';
import 'vtk.js/Sources/Rendering/Profiles/Glyph';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPolyLineWidget from 'vtk.js/Sources/Widgets/Widgets3D/PolyLineWidget';
import vtkWidgetManager from 'vtk.js/Sources/Widgets/Core/WidgetManager';
import vtkInteractorObserver from 'vtk.js/Sources/Rendering/Core/InteractorObserver';

import { bindSVGRepresentation } from 'vtk.js/Examples/Widgets/Utilities/SVGHelpers';
import controlPanel from './controlPanel.html';

const { computeWorldToDisplay } = vtkInteractorObserver;

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();

const cone = vtkConeSource.newInstance();
const mapper = vtkMapper.newInstance();
const actor = vtkActor.newInstance();

actor.setMapper(mapper);
mapper.setInputConnection(cone.getOutputPort());
actor.getProperty().setOpacity(0.5);

renderer.addActor(actor);

// ----------------------------------------------------------------------------
// Widget manager
// ----------------------------------------------------------------------------

const widgetManager = vtkWidgetManager.newInstance();
widgetManager.setRenderer(renderer);

const widget = vtkPolyLineWidget.newInstance();
widget.placeWidget(cone.getOutputData().getBounds());

widgetManager.addWidget(widget);

renderer.resetCamera();
widgetManager.enablePicking();
widgetManager.grabFocus(widget);

bindSVGRepresentation(renderer, widget.getWidgetState(), {
  mapState(widgetState, { size }) {
    const states = widgetState.getStatesWithLabel('handles') || [];
    return states
      .filter((state) => state.getVisible() && state.getOrigin())
      .map((state) => {
        const coords = computeWorldToDisplay(renderer, ...state.getOrigin());
        return [coords[0], size[1] - coords[1]];
      });
  },
  render(data, h) {
    return data.map(([x, y], index) =>
      h(
        'text',
        {
          key: index,
          attrs: {
            x,
            y,
            dx: 12,
            dy: -12,
            fill: 'white',
            'font-size': 32,
          },
        },
        `L${index}`
      )
    );
  },
});

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);

document.querySelector('button').addEventListener('click', () => {
  widgetManager.grabFocus(widget);
});

document
  .querySelector('input[type=checkbox]')
  .addEventListener('change', (ev) => {
    widgetManager.setUseSvgLayer(ev.target.checked);
  });
