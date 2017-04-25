import vtkFullScreenRenderWindow  from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkImageGridSource         from 'vtk.js/Sources/Filters/Sources/ImageGridSource';
import vtkImageMapper             from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice              from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkInteractorStyleImage    from 'vtk.js/Sources/Interaction/Style/InteractorStyleImage';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const gridSource = vtkImageGridSource.newInstance();
gridSource.setDataExtent(0, 200, 0, 200, 0, 0);
gridSource.setGridSpacing(16, 16, 0);
gridSource.setGridOrigin(8, 8, 0);

const mapper = vtkImageMapper.newInstance();
mapper.setInputConnection(gridSource.getOutputPort());

const actor = vtkImageSlice.newInstance();
actor.getProperty().setColorWindow(255);
actor.getProperty().setColorLevel(127);
actor.setMapper(mapper);

const iStyle = vtkInteractorStyleImage.newInstance();
renderWindow.getInteractor().setInteractorStyle(iStyle);

renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.source = gridSource;
global.mapper = mapper;
global.actor = actor;
global.renderer = renderer;
global.renderWindow = renderWindow;
