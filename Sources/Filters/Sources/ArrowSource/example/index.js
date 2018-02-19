import 'vtk.js/Sources/favicon';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkArrowSource from 'vtk.js/Sources/Filters/Sources/ArrowSource';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

import controlPanel from './controlPanel.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

function createArrowPipeline() {
  const arrowSource = vtkArrowSource.newInstance();
  const actor = vtkActor.newInstance();
  const mapper = vtkMapper.newInstance();

  actor.setMapper(mapper);
  actor.getProperty().setEdgeVisibility(true);
  actor.getProperty().setEdgeColor(1, 0, 0);
  actor.getProperty().setRepresentationToSurface();
  mapper.setInputConnection(arrowSource.getOutputPort());

  renderer.addActor(actor);
  return { arrowSource, mapper, actor };
}

const pipelines = [createArrowPipeline()];

renderer.resetCamera();
renderer.resetCameraClippingRange();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);

[
  'tipResolution',
  'tipRadius',
  'tipLength',
  'shaftResolution',
  'shaftRadius',
].forEach((propertyName) => {
  document.querySelector(`.${propertyName}`).addEventListener('input', (e) => {
    const value = Number(e.target.value);
    pipelines[0].arrowSource.set({ [propertyName]: value });
    renderer.resetCameraClippingRange();
    renderWindow.render();
  });
});

document.querySelector('.invert').addEventListener('change', (e) => {
  const invert = !!e.target.checked;
  pipelines[0].arrowSource.set({ invert });
  renderer.resetCameraClippingRange();
  renderWindow.render();
});

const directionElems = document.querySelectorAll('.direction');

function updateTransformedArrow() {
  const direction = [1, 0, 0];
  for (let i = 0; i < 3; i++) {
    direction[Number(directionElems[i].dataset.index)] = Number(
      directionElems[i].value
    );
  }
  pipelines[0].arrowSource.set({ direction });
  renderer.resetCameraClippingRange();
  renderWindow.render();
}

for (let i = 0; i < 3; i++) {
  directionElems[i].addEventListener('input', updateTransformedArrow);
}

function resetUI() {
  const defaultTipResolution = 6;
  const defaultTipRadius = 0.1;
  const defaultTipLength = 0.35;
  const defaultShaftResolution = 6;
  const defaultShaftRadius = 0.03;
  const direction = [1, 0, 0];

  document.querySelector(`.tipResolution`).value = Number(defaultTipResolution);
  pipelines[0].arrowSource.set({ tipResolution: Number(defaultTipResolution) });
  document.querySelector(`.tipRadius`).value = Number(defaultTipRadius);
  pipelines[0].arrowSource.set({ tipRadius: Number(defaultTipRadius) });
  document.querySelector(`.tipLength`).value = Number(defaultTipLength);
  pipelines[0].arrowSource.set({ tipLength: Number(defaultTipLength) });
  document.querySelector(`.shaftResolution`).value = Number(
    defaultShaftResolution
  );
  pipelines[0].arrowSource.set({
    shaftResolution: Number(defaultShaftResolution),
  });
  document.querySelector(`.shaftRadius`).value = Number(defaultShaftRadius);
  pipelines[0].arrowSource.set({ shaftRadius: Number(defaultShaftRadius) });
  document.querySelector(`.invert`).checked = false;
  pipelines[0].arrowSource.set({ invert: false });
  for (let i = 0; i < 3; i++) {
    directionElems[i].value = Number(direction[i]);
  }
  pipelines[0].arrowSource.set({ direction });

  renderer.resetCamera();
  renderer.resetCameraClippingRange();
  renderWindow.render();
}

const resetButton = document.querySelector('.reset');
resetButton.addEventListener('click', resetUI);

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.pipelines = pipelines;
global.renderer = renderer;
global.renderWindow = renderWindow;
