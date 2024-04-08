import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Misc/RenderingAPIs';
import '@kitware/vtk.js/Rendering/Profiles/Volume';

import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';
import vtkInteractorStyleTrackballCamera from '@kitware/vtk.js/Interaction/Style/InteractorStyleTrackballCamera';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';
import vtkRenderer from '@kitware/vtk.js/Rendering/Core/Renderer';
import vtkRenderWindow from '@kitware/vtk.js/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from '@kitware/vtk.js/Rendering/Core/RenderWindowInteractor';
import vtkVolume from '@kitware/vtk.js/Rendering/Core/Volume';
import vtkVolumeMapper from '@kitware/vtk.js/Rendering/Core/VolumeMapper';

// Force the loading of HttpDataAccessHelper to support gzip decompression
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';

// ----------------------------------------------------------------------------
// Background colors
// ----------------------------------------------------------------------------

async function createActor() {
  const actor = vtkVolume.newInstance();
  const mapper = vtkVolumeMapper.newInstance();
  mapper.setSampleDistance(0.7);
  mapper.setVolumetricScatteringBlending(0);
  mapper.setLocalAmbientOcclusion(0);
  mapper.setLAOKernelSize(10);
  mapper.setLAOKernelRadius(5);
  mapper.setComputeNormalFromOpacity(true);
  actor.setMapper(mapper);

  const ctfun = vtkColorTransferFunction.newInstance();
  ctfun.addRGBPoint(0, 0, 0, 0);
  ctfun.addRGBPoint(95, 1.0, 1.0, 1.0);
  ctfun.addRGBPoint(225, 0.66, 0.66, 0.5);
  ctfun.addRGBPoint(255, 0.3, 0.3, 0.5);
  const ofun = vtkPiecewiseFunction.newInstance();
  ofun.addPoint(100.0, 0.0);
  ofun.addPoint(255.0, 1.0);
  actor.getProperty().setRGBTransferFunction(0, ctfun);
  actor.getProperty().setScalarOpacity(0, ofun);
  actor.getProperty().setInterpolationTypeToLinear();
  actor.getProperty().setShade(true);
  actor.getProperty().setAmbient(0.3);
  actor.getProperty().setDiffuse(1);
  actor.getProperty().setSpecular(1);
  actor.setScale(0.003, 0.003, 0.003);
  actor.setPosition(1, 1, -1.1);

  const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
  await reader.setUrl(`${__BASE_PATH__}/data/volume/LIDC2.vti`);
  await reader.loadData();
  const imageData = reader.getOutputData();

  mapper.setInputData(imageData);

  return actor;
}

const mainRenderWindow = vtkRenderWindow.newInstance();
const mainRenderWindowView = mainRenderWindow.newAPISpecificView();
mainRenderWindow.addView(mainRenderWindowView);

const rootContainer = document.createElement('div');
rootContainer.style.display = 'flex';
rootContainer.style['align-items'] = 'center';
rootContainer.style['justify-content'] = 'space-between';
rootContainer.style['flex-wrap'] = 'wrap';
document.body.appendChild(rootContainer);

function applyStyle(element) {
  const width = Math.floor(200 + Math.random() * 200);
  const height = Math.floor(200 + Math.random() * 200);
  element.style.width = `${width}px`;
  element.style.height = `${height}px`;
  element.style.margin = '20px';
  element.style.border = 'solid 2px #333';
  return element;
}

function addRenderWindow() {
  // Create a child renderwindow
  const renderWindow = vtkRenderWindow.newInstance();
  mainRenderWindow.addRenderWindow(renderWindow);

  // Create the corresponding view
  const renderWindowView = mainRenderWindowView.addMissingNode(renderWindow);

  // Create a container for the view
  const container = applyStyle(document.createElement('div'));
  rootContainer.appendChild(container);
  renderWindowView.setContainer(container);

  // Resize the view to the size of the container
  // Ideally, we would use a resize observer to resize the view and
  // call resizeFromChildRenderWindows on the main view when the container is resized
  const containerBounds = container.getBoundingClientRect();
  const pixRatio = window.devicePixelRatio;
  const dimensions = [
    containerBounds.width * pixRatio,
    containerBounds.height * pixRatio,
  ];
  renderWindowView.setSize(...dimensions);
  const canvas = renderWindowView.getCanvas();
  canvas.style.width = `${container.clientWidth}px`;
  canvas.style.height = `${container.clientHeight}px`;

  // Add an interactor to the view
  const interactor = vtkRenderWindowInteractor.newInstance();
  interactor.setView(renderWindowView);
  interactor.initialize();
  interactor.bindEvents(canvas);
  interactor.setInteractorStyle(
    vtkInteractorStyleTrackballCamera.newInstance()
  );

  return renderWindow;
}

// ----------------------------------------------------------------------------
// Fill up page
// ----------------------------------------------------------------------------

const childRenderWindows = [];
createActor().then((actor) => {
  // Main view has to be initialized before the first "render" from a child render window
  // We initialize before creating the child render windows because the interactor initialization calls "render" on them
  mainRenderWindowView.initialize();

  for (let i = 0; i < 64; i++) {
    const childRenderWindow = addRenderWindow();

    // Create the corresponding renderer
    const background = [
      0.5 * Math.random() + 0.25,
      0.5 * Math.random() + 0.25,
      0.5 * Math.random() + 0.25,
    ];
    const renderer = vtkRenderer.newInstance({ background });
    childRenderWindow.addRenderer(renderer);

    // Add the actor and reset camera
    renderer.addActor(actor);
    const camera = renderer.getActiveCamera();
    camera.yaw(90);
    camera.roll(90);
    camera.azimuth(Math.random() * 360);
    renderer.resetCamera();

    childRenderWindows.push(childRenderWindow);
  }

  mainRenderWindowView.resizeFromChildRenderWindows();
  mainRenderWindow.render();
});

// ----------------------------------------------------------------------------
// Globals
// ----------------------------------------------------------------------------

global.rw = mainRenderWindow;
global.glrw = mainRenderWindowView;
global.childRw = childRenderWindows;
