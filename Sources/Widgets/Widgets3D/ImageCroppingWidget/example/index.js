import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkWidgetManager from 'vtk.js/Sources/Widgets/Core/WidgetManager';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkOutlineFilter from 'vtk.js/Sources/Filters/General/OutlineFilter';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkImageCroppingWidget from 'vtk.js/Sources/Widgets/Widgets3D/ImageCroppingWidget';

import controlPanel from './controlPanel.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
const openGLRenderWindow = fullScreenRenderer.getOpenGLRenderWindow();

global.renderer = renderer;
global.renderWindow = renderWindow;

const outlineFilter = vtkOutlineFilter.newInstance();
const omapper = vtkMapper.newInstance();
const oactor = vtkActor.newInstance();
oactor.setMapper(omapper);
omapper.setInputConnection(outlineFilter.getOutputPort());

// ----------------------------------------------------------------------------
// 2D overlay rendering
// ----------------------------------------------------------------------------

const overlaySize = 15;
const overlayBorder = 2;
const overlay = document.createElement('div');
overlay.style.position = 'absolute';
overlay.style.width = `${overlaySize}px`;
overlay.style.height = `${overlaySize}px`;
overlay.style.border = `solid ${overlayBorder}px red`;
overlay.style.borderRadius = '50%';
overlay.style.left = '-100px';
overlay.style.pointerEvents = 'none';
document.querySelector('body').appendChild(overlay);

// ----------------------------------------------------------------------------
// Widget manager
// ----------------------------------------------------------------------------

const widgetManager = vtkWidgetManager.newInstance();
widgetManager.setRenderer(renderer);

const widget = vtkImageCroppingWidget.newInstance();

function widgetRegistration(e) {
  const action = e ? e.currentTarget.dataset.action : 'addWidget';
  const viewWidget = widgetManager[action](widget);
  if (viewWidget) {
    viewWidget.setDisplayCallback((coords) => {
      overlay.style.left = '-100px';
      if (coords) {
        const [w, h] = openGLRenderWindow.getSize();
        overlay.style.left = `${Math.round(
          (coords[0][0] / w) * window.innerWidth -
            overlaySize * 0.5 -
            overlayBorder
        )}px`;
        overlay.style.top = `${Math.round(
          ((h - coords[0][1]) / h) * window.innerHeight -
            overlaySize * 0.5 -
            overlayBorder
        )}px`;
      }
    });

    renderer.resetCamera();
    renderer.resetCameraClippingRange();
  }
  widgetManager.enablePicking();
  renderWindow.render();
}

// Initial widget register
widgetRegistration();

// -----------------------------------------------------------
// Get data
// -----------------------------------------------------------

const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
reader
  .setUrl(`${__BASE_PATH__}/data/volume/headsq.vti`, { loadData: true })
  .then(() => {
    const image = reader.getOutputData();
    widget.copyImageDataDescription(image);

    outlineFilter.setInputData(image);
    renderer.addActor(oactor);

    renderer.resetCamera();
    renderer.resetCameraClippingRange();
    renderWindow.render();
  });

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);

function updateFlag(e) {
  const value = !!e.target.checked;
  const name = e.currentTarget.dataset.name;
  widget.set({ [name]: value }); // can be called on either viewWidget or parentWidget

  widgetManager.enablePicking();
  renderWindow.render();
}

const elems = document.querySelectorAll('.flag');
for (let i = 0; i < elems.length; i++) {
  elems[i].addEventListener('change', updateFlag);
}

const buttons = document.querySelectorAll('button');
for (let i = 0; i < buttons.length; i++) {
  buttons[i].addEventListener('click', widgetRegistration);
}
