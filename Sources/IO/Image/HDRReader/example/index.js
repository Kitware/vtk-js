import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkPlaneSource from '@kitware/vtk.js/Filters/Sources/PlaneSource';
import vtkHDRReader from '@kitware/vtk.js/IO/Image/HDRReader';
import vtkTexture from '@kitware/vtk.js/Rendering/Core/Texture';
import vtkURLExtract from '@kitware/vtk.js/Common/Core/URLExtract';

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------
const userParams = vtkURLExtract.extractURLParameters();

const reader = vtkHDRReader.newInstance();
const texture = vtkTexture.newInstance();
const planeSource = vtkPlaneSource.newInstance();
const mapper = vtkMapper.newInstance();
const actor = vtkActor.newInstance();
mapper.setInputConnection(planeSource.getOutputPort());
actor.setMapper(mapper);

// ----------------------------------------------------------------------------
// Use a file reader to load a local file
// ----------------------------------------------------------------------------

const myContainer = document.querySelector('body');
const fileContainer = document.createElement('div');
fileContainer.innerHTML =
  '<div>Select a hdr file.<br/><input type="file" class="file"/></div>';
myContainer.appendChild(fileContainer);

const fileInput = fileContainer.querySelector('input');

function zoomCameraToFitPlane(camera, planeWidth, planeHeight) {
  const fov = 60; // Field of view in degrees

  // Calculate the distance needed to fit the plane in view
  const distance =
    Math.max(planeWidth, planeHeight) /
    (2 * Math.tan((fov * Math.PI) / 180 / 2));

  // Set camera position
  camera.setPosition(planeWidth / 2, planeHeight / 2, distance);
  camera.setFocalPoint(planeWidth / 2, planeHeight / 2, 0);
  camera.setViewUp(0, 1, 0);

  // Set parallel scale for orthographic projection
  camera.setParallelScale(planeHeight / 2);
}

function update() {
  // Get the vtkImageData from the reader
  const imageData = reader.getOutputData();

  // Set the vtkImageData as the texture input
  texture.setInputData(imageData);

  // Get the image's extent and spacing
  const [xMin, xMax, yMin, yMax] = imageData.getExtent();
  const [spacingX, spacingY] = imageData.getSpacing();

  // Calculate the plane's width and height based on the image's dimensions
  const planeWidth = (xMax - xMin + 1) * spacingX;
  const planeHeight = (yMax - yMin + 1) * spacingY;

  // Set the plane's origin and corners based on calculated width and height
  planeSource.setOrigin(0, 0, 0);
  planeSource.setPoint1(planeWidth, 0, 0); // Horizontal edge
  planeSource.setPoint2(0, planeHeight, 0); // Vertical edge

  actor.addTexture(texture);

  const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
  const renderer = fullScreenRenderer.getRenderer();
  const renderWindow = fullScreenRenderer.getRenderWindow();
  const camera = renderer.getActiveCamera();
  const interactor = renderWindow.getInteractor();

  // Disable default interactor style
  interactor.setInteractorStyle(null);

  renderer.addActor(actor);

  // Adjust the camera to fit the plane in the view
  zoomCameraToFitPlane(camera, planeWidth, planeHeight);
  renderer.resetCameraClippingRange();

  renderWindow.render();
}

function handleFile(event) {
  event.preventDefault();
  const dataTransfer = event.dataTransfer;
  const files = event.target.files || dataTransfer.files;
  if (files.length === 1) {
    const file = files[0];
    const fileReader = new FileReader();
    fileReader.onload = () => {
      reader.parse(fileReader.result);
      update();
    };
    fileReader.readAsArrayBuffer(file);
  }
}

fileInput.addEventListener('change', handleFile);

// ----------------------------------------------------------------------------
// Use the reader to download a file
// ----------------------------------------------------------------------------
if (userParams.fileURL) {
  reader.setUrl(userParams.fileURL).then(() => {
    reader.loadData().then(() => {
      update();
    });
  });
}
