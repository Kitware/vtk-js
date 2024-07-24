import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import '@kitware/vtk.js/Rendering/Profiles/Glyph';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkWidgetManager from '@kitware/vtk.js/Widgets/Core/WidgetManager';

import {
  createInteractiveOrientationMarkerWidget,
  alignCameraOnViewWidgetOrientationChange,
} from '@kitware/vtk.js/Widgets/Widgets3D/InteractiveOrientationWidget/helpers';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0.2, 0.2, 0.2],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
const render = renderWindow.render;
const renderWindowInteractor = renderWindow.getInteractor();

// ----------------------------------------------------------------------------
// Add context to 3D scene for orientation
// ----------------------------------------------------------------------------

const cone = vtkConeSource.newInstance();
const mapper = vtkMapper.newInstance();
const actor = vtkActor.newInstance({ pickable: false });

actor.setMapper(mapper);
mapper.setInputConnection(cone.getOutputPort());
renderer.addActor(actor);

const camera = renderer.getActiveCamera();

// ----------------------------------------------------------------------------
// Widget manager
// ----------------------------------------------------------------------------
const widgetManager = vtkWidgetManager.newInstance();

const { interactiveOrientationWidget, orientationMarkerWidget } =
  createInteractiveOrientationMarkerWidget(
    widgetManager,
    renderWindowInteractor,
    renderer
  );

const vw = widgetManager.addWidget(interactiveOrientationWidget);

const subscription = alignCameraOnViewWidgetOrientationChange(
  vw,
  camera,
  orientationMarkerWidget,
  widgetManager,
  render
);

renderer.resetCamera();
widgetManager.enablePicking();
render();

global.subscription = subscription;
