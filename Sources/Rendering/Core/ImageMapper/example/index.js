import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkRTAnalyticSource from 'vtk.js/Sources/Filters/Sources/RTAnalyticSource';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkInteractorStyleImage from 'vtk.js/Sources/Interaction/Style/InteractorStyleImage';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const rtSource = vtkRTAnalyticSource.newInstance();
rtSource.setWholeExtent(0, 200, 0, 200, 0, 200);
rtSource.setCenter(100, 100, 100);
rtSource.setStandardDeviation(0.3);

const mapper = vtkImageMapper.newInstance();
mapper.setInputConnection(rtSource.getOutputPort());
mapper.setSliceAtFocalPoint(true);
// mapper.setZSlice(5);

const actor = vtkImageSlice.newInstance();
actor.getProperty().setColorWindow(255);
actor.getProperty().setColorLevel(127);
actor.setMapper(mapper);

const iStyle = vtkInteractorStyleImage.newInstance();
iStyle.setInteractionMode('IMAGE_SLICING');
renderWindow.getInteractor().setInteractorStyle(iStyle);

renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.source = rtSource;
global.mapper = mapper;
global.actor = actor;
global.renderer = renderer;
global.renderWindow = renderWindow;
