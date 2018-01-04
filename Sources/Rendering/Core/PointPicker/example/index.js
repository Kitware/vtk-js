import 'vtk.js/Sources/favicon';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkOutlineFilter from 'vtk.js/Sources/Filters/General/OutlineFilter';
import vtkPickerInteractorStyle from 'vtk.js/Sources/Rendering/Core/PointPicker/example/PickerInteractorStyle';
import vtkPointPicker from 'vtk.js/Sources/Rendering/Core/PointPicker';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

const picker = vtkPointPicker.newInstance();

const iStyle = vtkPickerInteractorStyle.newInstance();
renderWindow.getInteractor().setInteractorStyle(iStyle);
renderWindow.getInteractor().setPicker(picker);

// ----------------------------------------------------------------------------
// Add a cube source
// ----------------------------------------------------------------------------
const cube = vtkCubeSource.newInstance();
cube.setCenter(0, 0, 0);

const outline = vtkOutlineFilter.newInstance();
outline.setInputConnection(cube.getOutputPort());

const mapper = vtkMapper.newInstance();
mapper.setInputData(outline.getOutputData());
const actor = vtkActor.newInstance();
actor.setMapper(mapper);
actor.getProperty().setColor(0.0, 0.0, 1.0);

renderer.addActor(actor);

renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.mapper = mapper;
global.actor = actor;
global.renderer = renderer;
global.renderWindow = renderWindow;
global.picker = renderWindow.getInteractor().getPicker();
