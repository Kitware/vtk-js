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

import vtkImageSlice from '@kitware/vtk.js/Rendering/Core/ImageSlice';
import vtkImageResliceMapper from '@kitware/vtk.js/Rendering/Core/ImageResliceMapper';
import vtkPlane from '@kitware/vtk.js/Common/DataModel/Plane';
import { SlabTypes } from '@kitware/vtk.js/Rendering/Core/ImageResliceMapper/Constants';
import vtkMath from '@kitware/vtk.js/Common/Core/Math';

// Force the loading of HttpDataAccessHelper to support gzip decompression
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';

// ----------------------------------------------------------------------------
// Background colors
// ----------------------------------------------------------------------------

const sharedOpacityFunction = vtkPiecewiseFunction.newInstance();
sharedOpacityFunction.addPoint(100.0, 0.0);
sharedOpacityFunction.addPoint(255.0, 1.0);

function getRandomColorTransferFunction() {
  const ctfun = vtkColorTransferFunction.newInstance();
  ctfun.addRGBPoint(0, 0, 0, 0);
  ctfun.addRGBPoint(95, Math.random(), Math.random(), Math.random());
  ctfun.addRGBPoint(225, 0.66, 0.66, 0.5);
  ctfun.addRGBPoint(255, 0.3, 0.3, 0.5);
  return ctfun;
}

function createVolumeActor(imageData) {
  // Create and setup the mapper
  const mapper = vtkVolumeMapper.newInstance();
  mapper.setSampleDistance(0.7);
  mapper.setVolumetricScatteringBlending(0);
  mapper.setLocalAmbientOcclusion(0);
  mapper.setLAOKernelSize(10);
  mapper.setLAOKernelRadius(5);
  mapper.setComputeNormalFromOpacity(true);
  mapper.setInputData(imageData);

  // Create and setup the actor
  const actor = vtkVolume.newInstance();
  actor
    .getProperty()
    .setRGBTransferFunction(0, getRandomColorTransferFunction());
  actor.getProperty().setScalarOpacity(0, sharedOpacityFunction);
  actor.getProperty().setInterpolationTypeToLinear();
  actor.getProperty().setShade(true);
  actor.getProperty().setAmbient(0.3);
  actor.getProperty().setDiffuse(0.8);
  actor.getProperty().setSpecular(1);
  actor.getProperty().setSpecularPower(8);
  actor.setMapper(mapper);

  return actor;
}

function createImageActor(imageData) {
  // Random plane normal
  const randomQuat = [
    Math.random(),
    Math.random(),
    Math.random(),
    Math.random(),
  ];
  const randomMat = new Float32Array(9);
  vtkMath.quaternionToMatrix3x3(randomQuat, randomMat); // No need to normalize the quaternion
  const randomNormal = [randomMat[0], randomMat[1], randomMat[2]];

  // Create and setup the plane
  const slicePlane = vtkPlane.newInstance();
  slicePlane.setNormal(...randomNormal);
  slicePlane.setOrigin(imageData.getCenter());

  // Create and setup mapper
  const mapper = vtkImageResliceMapper.newInstance();
  mapper.setSlicePlane(slicePlane);
  mapper.setSlabType(SlabTypes.MAX);
  mapper.setInputData(imageData);

  // Create and setup actor
  const actor = vtkImageSlice.newInstance();
  actor.getProperty().setRGBTransferFunction(getRandomColorTransferFunction());
  actor.setMapper(mapper);

  return actor;
}

async function createActors(numberOfActors) {
  const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
  await reader.setUrl(`${__BASE_PATH__}/data/volume/LIDC2.vti`);
  await reader.loadData();
  const imageData = reader.getOutputData();

  const actors = [];
  for (let i = 0; i < numberOfActors; ++i) {
    if (Math.random() > 0.5) {
      actors.push(createVolumeActor(imageData));
    } else {
      actors.push(createImageActor(imageData));
    }
  }

  return actors;
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
  renderWindow.addView(renderWindowView);

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
createActors(64).then((actors) => {
  // Main view has to be initialized before the first "render" from a child render window
  // We initialize before creating the child render windows because the interactor initialization calls "render" on them
  mainRenderWindowView.initialize();

  actors.forEach((actor) => {
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
  });

  mainRenderWindowView.resizeFromChildRenderWindows();
  mainRenderWindow.render();
});

// ----------------------------------------------------------------------------
// Globals
// ----------------------------------------------------------------------------

global.rw = mainRenderWindow;
global.glrw = mainRenderWindowView;
global.childRw = childRenderWindows;
