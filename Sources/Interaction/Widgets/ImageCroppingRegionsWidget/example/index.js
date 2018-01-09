import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkInteractorStyleImage from 'vtk.js/Sources/Interaction/Style/InteractorStyleImage';
import vtkImageCroppingRegionsWidget from 'vtk.js/Sources/Interaction/Widgets/ImageCroppingRegionsWidget';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
const interactorStyle2D = vtkInteractorStyleImage.newInstance();
console.log(interactorStyle2D);
renderWindow.getInteractor().setInteractorStyle(interactorStyle2D);
renderer.getActiveCamera().setParallelProjection(true);

// set the current image number to the first image
interactorStyle2D.setCurrentImageNumber(0);

// ----------------------------------------------------------------------------
// Create widget
// ----------------------------------------------------------------------------
const widget = vtkImageCroppingRegionsWidget.newInstance();
widget.setInteractor(renderWindow.getInteractor());

// called when the volume is loaded
function setupWidget(volumeMapper, imageMapper) {
  widget.setVolumeMapper(volumeMapper);
  widget.setEnable(true);
  // getWidgetRep() returns a widget AFTER setEnable(true).
  widget.getWidgetRep().setOpacity(0.8);
  // TODO widget.getWidgetRep().setLineColor(1.0, 0.0, 0.0);

  imageMapper.onModified(() => {
    // update slice and slice orientation
    const sliceMode = imageMapper.getCurrentSlicingMode();
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
  .setUrl(`${__BASE_PATH__}/data/volume/headsq.vti`, { loadData: true })
  .then(() => {
    const data = reader.getOutputData();
    // NOTE we don't care about image direction here
    data.setDirection(1, 0, 0, 0, 1, 0, 0, 0, 1);

    volumeMapper.setInputData(data);
    imageMapper.setInputData(data);

    // create our cropping widget
    setupWidget(volumeMapper, imageMapper);

    // After creating our cropping widget, we can now update our image mapper

    // These values can be tweaked
    const sliceMode = 2;
    const viewUp = [0, 1, 0];

    const sliceNormal = ['X', 'Y', 'Z'][sliceMode];
    imageMapper.setCurrentSlicingMode(sliceMode);
    imageMapper[`set${sliceNormal}Slice`](30);

    const camPosition = renderer
      .getActiveCamera()
      .getFocalPoint()
      .map((v, idx) => (idx === sliceMode ? v + 1 : v));
    renderer.getActiveCamera().set({ position: camPosition, viewUp });

    console.log('position', renderer.getActiveCamera().getPosition());
    console.log('camera', camPosition);

    renderer.resetCamera();
    renderWindow.render();
  });

renderWindow.render();

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.renderer = renderer;
global.renderWindow = renderWindow;
global.widget = widget;
