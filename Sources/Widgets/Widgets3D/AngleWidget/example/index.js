import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import '@kitware/vtk.js/Rendering/Profiles/Glyph';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkCubeSource from '@kitware/vtk.js/Filters/Sources/CubeSource';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkAngleWidget from '@kitware/vtk.js/Widgets/Widgets3D/AngleWidget';
import vtkWidgetManager from '@kitware/vtk.js/Widgets/Core/WidgetManager';

import GUI from 'lil-gui';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();

const cube = vtkCubeSource.newInstance();
const mapper = vtkMapper.newInstance();
const actor = vtkActor.newInstance();

actor.setMapper(mapper);
mapper.setInputConnection(cube.getOutputPort());
actor.getProperty().setOpacity(0.5);

renderer.addActor(actor);

// ----------------------------------------------------------------------------
// Widget manager
// ----------------------------------------------------------------------------

const widgetManager = vtkWidgetManager.newInstance();
widgetManager.setRenderer(renderer);

const widget = vtkAngleWidget.newInstance();
// widget.placeWidget(cube.getOutputData().getBounds());

const widgetInView = widgetManager.addWidget(widget);

renderer.resetCamera();
widgetManager.enablePicking();
fullScreenRenderer.getInteractor().render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

const gui = new GUI();
const params = {
  Angle: 0,
  GrabFocus: () => {
    widgetManager.grabFocus(widget);
    widgetManager.enablePicking();
    renderer.resetCameraClippingRange();
    fullScreenRenderer.getInteractor().render();
  },
};

gui.add(params, 'Angle').name('Angle').listen();
gui.add(params, 'GrabFocus').name('Grab focus');

widgetInView.onEndInteractionEvent(() => renderer.resetCameraClippingRange());

widget.getWidgetState().onModified(() => {
  params.Angle = widget.getAngle();
  gui.controllers.forEach((c) => c.updateDisplay?.());
});

// -----------------------------------------------------------
// globals
// -----------------------------------------------------------

global.widget = widget;
