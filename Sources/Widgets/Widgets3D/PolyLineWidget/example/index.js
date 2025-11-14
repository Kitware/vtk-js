import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import '@kitware/vtk.js/Rendering/Profiles/Glyph';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkPolyLineWidget from '@kitware/vtk.js/Widgets/Widgets3D/PolyLineWidget';
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

const gui = new GUI();
const params = {
  UseSVGLayer: false,
  GrabFocus: () => {
    widgetManager.grabFocus(widget);
  },
};

gui
  .add(params, 'UseSVGLayer')
  .name('Use SVG layer')
  .onChange((value) => {
    widgetManager.setUseSvgLayer(!!value);
  });

gui.add(params, 'GrabFocus').name('Grab focus');
