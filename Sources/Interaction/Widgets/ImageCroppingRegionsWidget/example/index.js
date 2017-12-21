import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow     from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader          from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkImageMapper                from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice                 from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkInteractorStyleImage       from 'vtk.js/Sources/Interaction/Style/InteractorStyleImage';
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
function setupWidget(imageMapper) {
  widget.setImageMapper(imageMapper);
  widget.setEnable(true);

  renderWindow.render();
}

// ----------------------------------------------------------------------------
// Set up volume
// ----------------------------------------------------------------------------
const mapper = vtkImageMapper.newInstance();
const actor = vtkImageSlice.newInstance();
actor.setMapper(mapper);
renderer.addViewProp(actor);

const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
reader.setUrl(`${__BASE_PATH__}/data/volume/headsq.vti`, { loadData: true }).then(() => {
  const data = reader.getOutputData();
  // we don't care about image direction here
  data.setDirection(1, 0, 0, 0, 1, 0, 0, 0, 1);

  mapper.setInputData(data);
  // change me!
  const sliceMode = 0;
  const sliceNormal = ['X', 'Y', 'Z'][sliceMode];
  mapper.setCurrentSlicingMode(sliceMode);
  mapper[`set${sliceNormal}Slice`](32);

  const camPosition = renderer.getActiveCamera().getFocalPoint().map((v, idx) => (idx === sliceMode ? (v + 1) : v));
  const viewUp = [0, 0, 0];
  // viewUp[(sliceMode + 2) % 3] = 1;
  viewUp[2] = 1;
  renderer.getActiveCamera().set({ position: camPosition, viewUp });
  console.log(renderer.getActiveCamera().getViewUp());

  // create our cropping widget
  setupWidget(mapper);

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
