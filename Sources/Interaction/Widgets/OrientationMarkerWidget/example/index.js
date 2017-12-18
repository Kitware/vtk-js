import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow  from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkActor                   from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkConeSource              from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkMapper                  from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkOrientationMarkerWidget from 'vtk.js/Sources/Interaction/Widgets/OrientationMarkerWidget';
import vtkAnnotatedCubeActor      from 'vtk.js/Sources/Rendering/Core/AnnotatedCubeActor/index.js';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({ background: [0.2, 0.2, 0.2] });
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

// create cone
const coneSource = vtkConeSource.newInstance();
const actor = vtkActor.newInstance();
const mapper = vtkMapper.newInstance();

actor.setMapper(mapper);
mapper.setInputConnection(coneSource.getOutputPort());

renderer.addActor(actor);

// create axes
const axes = vtkAnnotatedCubeActor.newInstance();
axes.setResolution(400);
axes.setFontStyle('bold');
axes.setFontColor('black');
axes.setEdgeThickness(0.1);
axes.setXPlusFaceProperty({ text: '+X', faceColor: '#ff0000' });
axes.setXMinusFaceProperty({ text: '-X', faceColor: '#ffff00' });
axes.setYPlusFaceProperty({ text: '+Y', faceColor: '#00ff00' });
axes.setYMinusFaceProperty({ text: '-Y', faceColor: '#00ffff' });
axes.setZPlusFaceProperty({ text: '+Z', faceColor: '#ff00ff' });
axes.setZMinusFaceProperty({ text: '-Z', faceColor: '#0000ff' });

// create orientation widget
const orientationWidget = vtkOrientationMarkerWidget.newInstance({
  actor: axes,
  interactor: renderWindow.getInteractor(),
});
orientationWidget.setEnabled(true);
orientationWidget.setViewportCorner(vtkOrientationMarkerWidget.Corners.BOTTOM_RIGHT);
orientationWidget.setViewportSize(0.15);

renderer.resetCamera();
renderWindow.render();
