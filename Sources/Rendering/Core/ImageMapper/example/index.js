import vtkFullScreenRenderWindow from '../../../../../Sources/Testing/FullScreenRenderWindow';

import vtkImageGridSource         from '../../../../../Sources/Filters/Sources/ImageGridSource';
import vtkImageMapper             from '../../../../../Sources/Rendering/Core/ImageMapper';
import vtkImageSlice              from '../../../../../Sources/Rendering/Core/ImageSlice';

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
