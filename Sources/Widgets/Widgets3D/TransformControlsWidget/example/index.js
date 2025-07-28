/* eslint-disable */
// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import '@kitware/vtk.js/Rendering/Profiles/Glyph';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkWidgetManager from '@kitware/vtk.js/Widgets/Core/WidgetManager';

import vtkTransformControlsWidget from '@kitware/vtk.js/Widgets/Widgets3D/TransformControlsWidget';
const { TransformMode } = vtkTransformControlsWidget;

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Widget manager
// ----------------------------------------------------------------------------

const widgetManager = vtkWidgetManager.newInstance();
widgetManager.setRenderer(renderer);

const widget = vtkTransformControlsWidget.newInstance();
const viewWidget = widgetManager.addWidget(widget);
viewWidget.setScaleInPixels(true);

renderer.resetCamera();
renderer.resetCameraClippingRange();
widgetManager.enablePicking();
fullScreenRenderer.getInteractor().render();

// --------

const coneSource = vtkConeSource.newInstance({
  center: [0, 0, 0],
});

const mapper = vtkMapper.newInstance();
mapper.setInputConnection(coneSource.getOutputPort());

const actor = vtkActor.newInstance();
actor.setMapper(mapper);
// actor.getProperty().setAmbient(1);
// actor.getProperty().setColor(1, 0, 1);

renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();

viewWidget.setActiveScaleFactor(1);
viewWidget.setUseActiveColor(true);
viewWidget.setActiveColor([255, 255, 0]);

viewWidget.getRepresentations().forEach((rep) =>
  rep.getActors().forEach((actor) => {
    actor.getProperty().setAmbient(1);
  })
);

widget
  .getWidgetState()
  .getTransform()
  .onModified((state) => {
    actor.setPosition(state.getTranslation());
    actor.setScale(state.getScale());
    actor.setOrientationFromQuaternion(state.getRotation());
  });

renderer.resetCamera();
renderWindow.render();

global.r = renderer;
global.rw = renderWindow;
global.vw = viewWidget;

window.onkeydown = (ev) => {
  switch (ev.key) {
    case 'q':
      widget.setMode(TransformMode.ROTATE);
      renderWindow.render();
      break;
    case 't':
      widget.setMode(TransformMode.TRANSLATE);
      renderWindow.render();
      break;
    case 'x':
      widget.setMode(TransformMode.SCALE);
      renderWindow.render();
      break;
  }
};
