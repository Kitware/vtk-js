// For streamlined VR development install the WebXR emulator extension
// https://github.com/MozillaReality/WebXR-emulator-extension

import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkWebXRRenderWindowHelper from '@kitware/vtk.js/Rendering/WebXR/RenderWindowHelper';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import { XrSessionTypes } from '@kitware/vtk.js/Rendering/WebXR/RenderWindowHelper/Constants';

import vtkInteractorStyleHMDXR from '@kitware/vtk.js/Interaction/Style/InteractorStyleHMDXR';
import vtkRenderWindowInteractor from '@kitware/vtk.js/Rendering/Core/RenderWindowInteractor';

// Force DataAccessHelper to have access to various data source
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HtmlDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/JSZipDataAccessHelper';

import vtkResourceLoader from '@kitware/vtk.js/IO/Core/ResourceLoader';

// Custom UI controls, including button to start XR session
import controlPanel from './controller.html';

// Dynamically load WebXR polyfill from CDN for WebVR and Cardboard API backwards compatibility
if (navigator.xr === undefined) {
  vtkResourceLoader
    .loadScript(
      'https://cdn.jsdelivr.net/npm/webxr-polyfill@latest/build/webxr-polyfill.js'
    )
    .then(() => {
      // eslint-disable-next-line no-new, no-undef
      new WebXRPolyfill();
    });
}

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

function createRenderingPipeline(filter) {
  const mapper = vtkMapper.newInstance();
  mapper.setInputConnection(filter.getOutputPort());

  const actor = vtkActor.newInstance();
  actor.setMapper(mapper);

  return actor;
}

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});

const interactor = vtkRenderWindowInteractor.newInstance();
interactor.setView(fullScreenRenderer.getApiSpecificRenderWindow());
interactor.initialize();

const interactorStyle = vtkInteractorStyleHMDXR.newInstance();
interactor.setInteractorStyle(interactorStyle);

const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
const XRHelper = vtkWebXRRenderWindowHelper.newInstance({
  renderWindow: fullScreenRenderer.getApiSpecificRenderWindow(),
  drawControllersRay: true,
});

const coneSource1 = vtkConeSource.newInstance({ height: 100.0, radius: 50 });

const coneSource2 = vtkConeSource.newInstance({
  height: 50.0,
  radius: 20,
});

const coneSource3 = vtkConeSource.newInstance({
  height: 50.0,
  radius: 20,
});

const coneActor1 = createRenderingPipeline(coneSource1);
const coneActor2 = createRenderingPipeline(coneSource2);
const coneActor3 = createRenderingPipeline(coneSource3);

coneActor3.setDragable(false);

renderer.addActor(coneActor1);
renderer.addActor(coneActor2);
renderer.addActor(coneActor3);

coneActor1.setPosition(0.0, 0.0, -20.0);
coneActor2.setPosition(50.0, 0.0, -20.0);
coneActor3.setPosition(-50.0, 0.0, -20.0);

renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);
const vrbutton = document.querySelector('.vrbutton');

vrbutton.addEventListener('click', (e) => {
  if (vrbutton.textContent === 'Send To VR') {
    XRHelper.startXR(XrSessionTypes.HmdVR);
    vrbutton.textContent = 'Return From VR';
  } else {
    XRHelper.stopXR();
    vrbutton.textContent = 'Send To VR';
  }
});

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.coneSource1 = coneSource1;
global.coneSource2 = coneSource2;
global.coneSource3 = coneSource3;

global.coneActor1 = coneSource1;
global.coneActor2 = coneSource2;
global.coneActor3 = coneSource3;

global.renderer = renderer;
global.renderWindow = renderWindow;
