import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkInteractorStyleImage from 'vtk.js/Sources/Interaction/Style/InteractorStyleImage';
import vtkImageCroppingRegionsWidget from 'vtk.js/Sources/Interaction/Widgets/ImageCroppingRegionsWidget';

import controlPanel from './controlPanel.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
const interactorStyle2D = vtkInteractorStyleImage.newInstance();
fullScreenRenderer.addController(controlPanel);
renderWindow.getInteractor().setInteractorStyle(interactorStyle2D);
renderer.getActiveCamera().setParallelProjection(true);

// set the current image number to the first image
interactorStyle2D.setCurrentImageNumber(0);

// ----------------------------------------------------------------------------
// Helper methods for setting up control panel
// ----------------------------------------------------------------------------

function setupControlPanel(data, imageMapper) {
  const sliceInputs = [
    document.querySelector('.sliceX'),
    document.querySelector('.sliceY'),
    document.querySelector('.sliceZ'),
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

  viewAxisInput.value = ['X', 'Y', 'Z'][imageMapper.getSlicingMode()];

  sliceInputs.forEach((el, idx) => {
    el.addEventListener('input', (ev) => {
      const sliceNormal = ['X', 'Y', 'Z'][idx];
      imageMapper[`set${sliceNormal}Slice`](Number(ev.target.value));

      renderWindow.render();
    });
  });

  viewAxisInput.addEventListener('input', (ev) => {
    const sliceMode = ['X', 'Y', 'Z'].indexOf(ev.target.value);
    imageMapper.setSlicingMode(sliceMode);
    const slice = sliceInputs[sliceMode].value;
    imageMapper[`set${ev.target.value}Slice`](slice);

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
widget.onCroppingPlanesPositionChanged(() => {
  console.log('planes changed:', widget.getWidgetRep().getPlanePositions());
});

// called when the volume is loaded
function setupWidget(volumeMapper, imageMapper) {
  widget.setVolumeMapper(volumeMapper);
  widget.setHandleSize(10); // in pixels
  widget.setEnabled(true);

  // getWidgetRep() returns a widget AFTER setEnabled(true).

  // Demonstrate widget representation APIs
  widget.getWidgetRep().setOpacity(0.8);
  widget.getWidgetRep().setEdgeColor(0.0, 0.0, 1.0);

  imageMapper.onModified(() => {
    // update slice and slice orientation
    const sliceMode = imageMapper.getSlicingMode();
    const sliceNormal = ['X', 'Y', 'Z'][sliceMode];
    const slice = imageMapper[`get${sliceNormal}Slice`]();
    widget.setSlice(slice);
    widget.setSliceOrientation(sliceMode);
  });

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
  .setUrl(`${__BASE_PATH__}/data/volume/LIDC2.vti`, { loadData: true })
  .then(() => {
    const data = reader.getOutputData();
    // NOTE we don't care about image direction here
    data.setDirection(1, 0, 0, 0, 1, 0, 0, 0, 1);

    volumeMapper.setInputData(data);
    imageMapper.setInputData(data);

    // create our cropping widget
    setupWidget(volumeMapper, imageMapper);

    // After creating our cropping widget, we can now update our image mapper
    // with default slice orientation/mode and camera view.
    const sliceMode = 2;
    const viewUp = [0, 1, 0];

    const sliceNormal = ['X', 'Y', 'Z'][sliceMode];
    imageMapper.setSlicingMode(sliceMode);
    imageMapper[`set${sliceNormal}Slice`](0);

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
