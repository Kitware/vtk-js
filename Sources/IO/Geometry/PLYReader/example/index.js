import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkPLYReader from '@kitware/vtk.js/IO/Geometry/PLYReader';
import vtkTexture from '@kitware/vtk.js/Rendering/Core/Texture';
import vtkURLExtract from '@kitware/vtk.js/Common/Core/URLExtract';

import controlPanel from './controller.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------
const userParams = vtkURLExtract.extractURLParameters();
const url = userParams.fileURL;
const duplicatePointsForFaceTexture =
  userParams.duplicatePointsForFaceTexture || false;

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------
const reader = vtkPLYReader.newInstance({
  duplicatePointsForFaceTexture,
});
const mapper = vtkMapper.newInstance({ scalarVisibility: false });
const actor = vtkActor.newInstance();

actor.setMapper(mapper);
mapper.setInputConnection(reader.getOutputPort());

// ----------------------------------------------------------------------------

function refresh() {
  const resetCamera = renderer.resetCamera;
  const render = renderWindow.render;
  resetCamera();
  render();
}

function update() {
  renderer.addActor(actor);

  actor.getMapper().setScalarVisibility(true);
  const clr = { r: 200 / 255.0, g: 200 / 255.0, b: 200 / 255.0 };
  actor.getProperty().setColor(clr.r, clr.g, clr.b);

  refresh();
}

// ----------------------------------------------------------------------------
// Use a file reader to load a local file
// ----------------------------------------------------------------------------

fullScreenRenderer.addController(controlPanel);

const fileInput = document.querySelector('input');
const checkbox = document.querySelector('#duplicate_points_for_face_texture');
checkbox.checked = duplicatePointsForFaceTexture;

function handlePlyFile(file) {
  const fileReader = new FileReader();
  fileReader.onload = function onLoad(e) {
    reader.parseAsArrayBuffer(fileReader.result);
    update();
  };
  fileReader.readAsArrayBuffer(file);
}

function handleImgFile(file) {
  const fileReader = new FileReader();

  fileReader.onload = () => {
    const image = new Image();
    image.src = fileReader.result;
    const texture = vtkTexture.newInstance();
    texture.setInterpolate(true);
    texture.setImage(image);
    actor.addTexture(texture);
    refresh();
  };
  fileReader.readAsDataURL(file);
}

function handleFile(event) {
  event.preventDefault();
  const dataTransfer = event.dataTransfer;
  const files = event.target.files || dataTransfer.files;
  if (files.length === 1) {
    handlePlyFile(files[0]);
  } else if (files.length > 1) {
    Array.from(files).forEach((file) => {
      const name = file.name.toLowerCase();
      if (name.endsWith('.ply')) {
        handlePlyFile(file);
      }
      if (
        name.endsWith('.png') ||
        name.endsWith('.jpg') ||
        name.endsWith('.jpeg')
      ) {
        handleImgFile(file);
      }
    });
  }
}

fileInput.addEventListener('change', handleFile);

checkbox.addEventListener('change', (e) => {
  const value = e.target.checked;
  console.log('duplicate points for face texture', value);
  window.location = `?duplicatePointsForFaceTexture=${value}`;
  refresh();
});

// ----------------------------------------------------------------------------
// Use the reader to download a file
// ----------------------------------------------------------------------------

if (url) {
  reader.setUrl(url).then(update);
}
