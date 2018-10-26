import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkRTAnalyticSource from 'vtk.js/Sources/Filters/Sources/RTAnalyticSource';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkInteractorStyleManipulator from 'vtk.js/Sources/Interaction/Style/InteractorStyleManipulator';

import Manipulators from 'vtk.js/Sources/Interaction/Manipulators';

const { SlicingMode } = vtkImageMapper;

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
mapper.setSlicingMode(SlicingMode.K);

const actor = vtkImageSlice.newInstance();
actor.getProperty().setColorWindow(100);
actor.getProperty().setColorLevel(50);
actor.setMapper(mapper);

const data = rtSource.getOutputData();
const range = data
  .getPointData()
  .getScalars()
  .getRange();
const wMin = 1;
const wMax = range[1] - range[0];
const wGet = actor.getProperty().getColorWindow;
const wSet = actor.getProperty().setColorWindow;
const lMin = range[0];
const lMax = range[1];
const lGet = actor.getProperty().getColorLevel;
const lSet = actor.getProperty().setColorLevel;
const extent = data.getExtent();
const kMin = extent[4];
const kMax = extent[5];
const kGet = mapper.getSlice;
const kSet = (slice) => mapper.setSlice(Math.round(slice));

const rangeManipulator = Manipulators.vtkMouseRangeManipulator.newInstance({
  button: 1,
  scrollEnabled: true,
});
rangeManipulator.setVerticalListener(wMin, wMax, 1, wGet, wSet);
rangeManipulator.setHorizontalListener(lMin, lMax, 1, lGet, lSet);
rangeManipulator.setScrollListener(kMin, kMax, 1, kGet, kSet);

const iStyle = vtkInteractorStyleManipulator.newInstance();
iStyle.addMouseManipulator(rangeManipulator);
renderWindow.getInteractor().setInteractorStyle(iStyle);

renderer.getActiveCamera().setParallelProjection(true);
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
