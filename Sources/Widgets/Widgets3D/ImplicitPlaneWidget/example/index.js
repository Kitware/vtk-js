import 'vtk.js/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkImplicitPlaneWidget from 'vtk.js/Widgets/Widgets3D/ImplicitPlaneWidget';
import vtkWidgetManager from 'vtk.js/Widgets/Core/WidgetManager';

import vtkActor from 'vtk.js/Rendering/Core/Actor';
import vtkConeSource from 'vtk.js/Filters/Sources/ConeSource';
import vtkMapper from 'vtk.js/Rendering/Core/Mapper';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();

// ----------------------------------------------------------------------------
// Add context to place widget
// ----------------------------------------------------------------------------

const cone = vtkConeSource.newInstance();
const mapper = vtkMapper.newInstance();
const actor = vtkActor.newInstance({ pickable: false });

actor.setMapper(mapper);
mapper.setInputConnection(cone.getOutputPort());
actor.getProperty().setOpacity(0.5);
renderer.addActor(actor);

// ----------------------------------------------------------------------------
// Widget manager
// ----------------------------------------------------------------------------

const widgetManager = vtkWidgetManager.newInstance();
widgetManager.setRenderer(renderer);

const widget = vtkImplicitPlaneWidget.newInstance();
widget.getWidgetState().setNormal(0, 0, 1);
widget.placeWidget(cone.getOutputData().getBounds());
widget.setPlaceFactor(3);

widgetManager.addWidget(widget);

renderer.resetCamera();
widgetManager.enablePicking();
