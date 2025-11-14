import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Volume';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkRTAnalyticSource from '@kitware/vtk.js/Filters/Sources/RTAnalyticSource';
import vtkImageMapper from '@kitware/vtk.js/Rendering/Core/ImageMapper';
import vtkImageSlice from '@kitware/vtk.js/Rendering/Core/ImageSlice';
import vtkInteractorStyleManipulator from '@kitware/vtk.js/Interaction/Style/InteractorStyleManipulator';

import Manipulators from '@kitware/vtk.js/Interaction/Manipulators';

import GUI from 'lil-gui';

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
const range = data.getPointData().getScalars().getRange();
const wMin = 1;
const wMax = range[1] - range[0];
const wGet = actor.getProperty().getColorWindow;
const wSet = (w) => {
  document.querySelector('.wWidth').textContent = w;
  actor.getProperty().setColorWindow(w);
};
const lMin = range[0];
const lMax = range[1];
const lGet = actor.getProperty().getColorLevel;
const lSet = (l) => {
  document.querySelector('.wLevel').textContent = l;
  actor.getProperty().setColorLevel(l);
};
const extent = data.getExtent();
const kMin = extent[4];
const kMax = extent[5];
const kGet = mapper.getSlice;
const kSet = (k) => {
  document.querySelector('.sliceNumber').textContent = k;
  mapper.setSlice(k);
};

const rangeManipulator = Manipulators.vtkMouseRangeManipulator.newInstance({
  button: 1,
  scrollEnabled: true,
});
rangeManipulator.setVerticalListener(wMin, wMax, 1, wGet, wSet, 1);
rangeManipulator.setHorizontalListener(lMin, lMax, 1, lGet, lSet, 1);
rangeManipulator.setScrollListener(kMin, kMax, 1, kGet, kSet, -0.5);

const iStyle = vtkInteractorStyleManipulator.newInstance();
iStyle.addMouseManipulator(rangeManipulator);
renderWindow.getInteractor().setInteractorStyle(iStyle);

renderer.getActiveCamera().setParallelProjection(true);
renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

const gui = new GUI();
const params = {
  sliceNumber: kGet(),
  wWidth: wGet(),
  wLevel: lGet(),
  slicingScale: 1.0,
  wWidthScale: 1.0,
  wLevelScale: 1.0,
};

gui
  .add(params, 'sliceNumber', kMin, kMax, 1)
  .name('Slice number')
  .onChange((value) => {
    kSet(Number(value));
  });

gui
  .add(params, 'wWidth', wMin, wMax, 1)
  .name('Window width')
  .onChange((value) => {
    wSet(Number(value));
  });

gui
  .add(params, 'wLevel', lMin, lMax, 1)
  .name('Window level')
  .onChange((value) => {
    lSet(Number(value));
  });

gui
  .add(params, 'slicingScale', 0.1, 5.0, 0.1)
  .name('Slicing scale')
  .onChange((value) => {
    rangeManipulator.setScrollListener(
      kMin,
      kMax,
      1,
      kGet,
      kSet,
      Number(value)
    );
  });

gui
  .add(params, 'wWidthScale', 0.1, 5.0, 0.1)
  .name('Width scale')
  .onChange((value) => {
    rangeManipulator.setVerticalListener(
      wMin,
      wMax,
      1,
      wGet,
      wSet,
      Number(value)
    );
  });

gui
  .add(params, 'wLevelScale', 0.1, 5.0, 0.1)
  .name('Level scale')
  .onChange((value) => {
    rangeManipulator.setHorizontalListener(
      lMin,
      lMax,
      1,
      lGet,
      lSet,
      Number(value)
    );
  });

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.source = rtSource;
global.mapper = mapper;
global.actor = actor;
global.renderer = renderer;
global.renderWindow = renderWindow;
