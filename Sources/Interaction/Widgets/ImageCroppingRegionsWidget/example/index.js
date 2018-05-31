import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkInteractorStyleImage from 'vtk.js/Sources/Interaction/Style/InteractorStyleImage';
import vtkInteractorStyleTrackballCamera from 'vtk.js/Sources/Interaction/Style/InteractorStyleTrackballCamera';
import vtkImageCroppingRegionsWidget from 'vtk.js/Sources/Interaction/Widgets/ImageCroppingRegionsWidget';

import controlPanel from './controlPanel.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
/* eslint-disable */
const interactorStyle2D = vtkInteractorStyleImage.newInstance();
const interactorStyle3D = vtkInteractorStyleTrackballCamera.newInstance();
// switch to using interactorStyle2D if you want 2D controls
renderWindow.getInteractor().setInteractorStyle(interactorStyle3D);
// set the current image number to the first image
// interactorStyle2D.setCurrentImageNumber(0);
/* eslint-enable */
fullScreenRenderer.addController(controlPanel);
// renderer.getActiveCamera().setParallelProjection(true);

// ----------------------------------------------------------------------------
// Helper methods for setting up control panel
// ----------------------------------------------------------------------------

function setupControlPanel(data, imageMapper) {
  const sliceInputs = [
    document.querySelector('.sliceI'),
    document.querySelector('.sliceJ'),
    document.querySelector('.sliceK'),
  ];
  const viewAxisInput = document.querySelector('.viewAxis');

  const extent = data.getExtent();
  sliceInputs.forEach((el, idx) => {
    const lowerExtent = extent[idx * 2];
    const upperExtent = extent[idx * 2 + 1];
    el.setAttribute('min', lowerExtent);
    el.setAttribute('max', upperExtent);
    el.setAttribute('value', (upperExtent - lowerExtent) / 2);
  });

  viewAxisInput.value = 'IJKXYZ'[imageMapper.getSlicingMode()];

  sliceInputs.forEach((el, idx) => {
    el.addEventListener('input', (ev) => {
      const sliceMode = sliceInputs.indexOf(el);
      if (imageMapper.getSlicingMode() === sliceMode) {
        imageMapper.setSlice(Number(ev.target.value));
        renderWindow.render();
      }
    });
  });

  viewAxisInput.addEventListener('input', (ev) => {
    const sliceMode = 'IJKXYZ'.indexOf(ev.target.value);
    imageMapper.setSlicingMode(sliceMode);
    const slice = sliceInputs[sliceMode].value;
    imageMapper.setSlice(slice);

    const camPosition = renderer
      .getActiveCamera()
      .getFocalPoint()
      .map((v, idx) => (idx === sliceMode ? v + 1 : v));
    const viewUp = [0, 0, 0];
    viewUp[(sliceMode + 2) % 3] = 1;
    renderer.getActiveCamera().set({ position: camPosition, viewUp });
    renderer.resetCamera();

    renderWindow.render();
  });
}

// ----------------------------------------------------------------------------
// Create widget
// ----------------------------------------------------------------------------
const widget = vtkImageCroppingRegionsWidget.newInstance();
widget.setInteractor(renderWindow.getInteractor());

// Demonstrate cropping planes event update
widget.onCroppingPlanesChanged((planes) => {
  console.log('planes changed:', planes);
});

// called when the volume is loaded
function setupWidget(volumeMapper, imageMapper) {
  widget.setVolumeMapper(volumeMapper);
  widget.setHandleSize(12); // in pixels
  widget.setEnabled(true);

  // demonstration of setting various types of handles
  widget.setFaceHandlesEnabled(true);
  // widget.setEdgeHandlesEnabled(true);
  widget.setCornerHandlesEnabled(true);

  renderWindow.render();
}

// ----------------------------------------------------------------------------
// Set up volume
// ----------------------------------------------------------------------------
const volumeMapper = vtkVolumeMapper.newInstance();
const imageMapper = vtkImageMapper.newInstance();
const actor = vtkImageSlice.newInstance();
actor.setMapper(imageMapper);
renderer.addViewProp(actor);

const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
reader
  .setUrl(`${__BASE_PATH__}/data/volume/headsq.vti`, { loadData: true })
  .then(() => {
    const data = reader.getOutputData();

    volumeMapper.setInputData(data);
    imageMapper.setInputData(data);

    // create our cropping widget
    setupWidget(volumeMapper, imageMapper);

    // After creating our cropping widget, we can now update our image mapper
    // with default slice orientation/mode and camera view.
    const sliceMode = vtkImageMapper.SlicingMode.K;
    const viewUp = [0, 1, 0];

    imageMapper.setSlicingMode(sliceMode);
    imageMapper.setSlice(0);

    const camPosition = renderer
      .getActiveCamera()
      .getFocalPoint()
      .map((v, idx) => (idx === sliceMode ? v + 1 : v));
    renderer.getActiveCamera().set({ position: camPosition, viewUp });

    // setup control panel
    setupControlPanel(data, imageMapper);

    renderer.resetCamera();
    renderWindow.render();
  });

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.renderer = renderer;
global.renderWindow = renderWindow;
global.widget = widget;
