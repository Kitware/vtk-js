import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkPolyLineWidget from 'vtk.js/Sources/Interaction/Widgets2/PolyLineWidget';
import vtkWidgetManager from 'vtk.js/Sources/Interaction/Widgets2/WidgetManager';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
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
const openGLRenderWindow = fullScreenRenderer.getOpenGLRenderWindow();

const cone = vtkConeSource.newInstance();
const mapper = vtkMapper.newInstance();
const actor = vtkActor.newInstance();
actor.setMapper(mapper);
mapper.setInputConnection(cone.getOutputPort());
actor.getProperty().setOpacity(0.5);

renderer.addActor(actor);

// ----------------------------------------------------------------------------
// 2D overlay rendering
// ----------------------------------------------------------------------------

// const overlaySize = 15;
// const overlayBorder = 2;
// const overlay = document.createElement('div');
// overlay.style.position = 'absolute';
// overlay.style.width = `${overlaySize}px`;
// overlay.style.height = `${overlaySize}px`;
// overlay.style.border = `solid ${overlayBorder}px red`;
// overlay.style.borderRadius = '50%';
// overlay.style.left = '-100px';
// overlay.style.pointerEvents = 'none';
// document.querySelector('body').appendChild(overlay);

// ----------------------------------------------------------------------------
// Widget manager
// ----------------------------------------------------------------------------

const widgetManager = vtkWidgetManager.newInstance();
widgetManager.setRenderingContext(openGLRenderWindow, renderer);

const widget = vtkPolyLineWidget.newInstance();
widget.placeWidget(cone.getOutputData().getBounds());
let viewWidget;

function widgetRegistration(e) {
  const action = e ? e.currentTarget.dataset.action : 'registerWidget';
  viewWidget = widgetManager[action](widget);
  // if (viewWidget) {
  //   viewWidget.setDisplayCallback((coords) => {
  //     overlay.style.left = '-100px';
  //     if (coords) {
  //       const [w, h] = openGLRenderWindow.getSize();
  //       overlay.style.left = `${Math.round(
  //         coords[0][0] / w * window.innerWidth -
  //           overlaySize * 0.5 -
  //           overlayBorder
  //       )}px`;
  //       overlay.style.top = `${Math.round(
  //         (h - coords[0][1]) / h * window.innerHeight -
  //           overlaySize * 0.5 -
  //           overlayBorder
  //       )}px`;
  //     }
  //   });

  //   renderer.resetCamera();
  //   renderer.resetCameraClippingRange();
  // }
  widgetManager.enablePicking();
  renderWindow.render();
}

// Initial widget register
widgetRegistration();

global.viewWidget = viewWidget;

renderer.resetCamera();
renderer.resetCameraClippingRange();
widgetManager.enablePicking();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);

document.querySelector('button').addEventListener('click', () => {
  widgetManager.grabFocus(widget);
});
