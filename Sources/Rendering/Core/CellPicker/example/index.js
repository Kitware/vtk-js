import vtkActor                  from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkConeSource             from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper                 from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPickerInteractorStyle  from 'vtk.js/Sources/Rendering/Core/CellPicker/example/PickerInteractorStyle';
import vtkCellPicker             from 'vtk.js/Sources/Rendering/Core/CellPicker';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// Press shift+click to pick
const picker = vtkCellPicker.newInstance();
picker.setPickFromList(1);
picker.initializePickList();

const iStyle = vtkPickerInteractorStyle.newInstance();
iStyle.setContainer(fullScreenRenderer.getContainer());
renderWindow.getInteractor().setInteractorStyle(iStyle);
renderWindow.getInteractor().setPicker(picker);

// ----------------------------------------------------------------------------
// Add a cube source
// ----------------------------------------------------------------------------
const cone = vtkConeSource.newInstance();
const mapper = vtkMapper.newInstance();
mapper.setInputData(cone.getOutputData());
const actor = vtkActor.newInstance();
actor.setMapper(mapper);
actor.getProperty().setColor(0.0, 0.0, 1.0);

renderer.addActor(actor);

// Only try to pick cone
picker.addPickList(actor);

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
