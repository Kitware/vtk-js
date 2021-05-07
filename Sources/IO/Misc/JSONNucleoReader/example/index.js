import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkJSONNucleoReader from 'vtk.js/Sources/IO/Misc/JSONNucleoReader';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const reader = vtkJSONNucleoReader.newInstance();
const mapper = vtkMapper.newInstance();
const actor = vtkActor.newInstance();

mapper.setInputConnection(reader.getOutputPort());
actor.setMapper(mapper);

// ----------------------------------------------------------------------------

function update() {
  const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
  const renderer = fullScreenRenderer.getRenderer();
  const renderWindow = fullScreenRenderer.getRenderWindow();

  const resetCamera = renderer.resetCamera;
  const render = renderWindow.render;

  renderer.addActor(actor);
  resetCamera();
  render();
}

// ----------------------------------------------------------------------------
// Use a file reader to load a local file
// ----------------------------------------------------------------------------

const myContainer = document.querySelector('body');
const fileContainer = document.createElement('div');
fileContainer.innerHTML = '<input type="file" class="file"/>';
myContainer.appendChild(fileContainer);

const fileInput = fileContainer.querySelector('input');

function handleFile(event) {
  event.preventDefault();
  const dataTransfer = event.dataTransfer;
  const files = event.target.files || dataTransfer.files;
  if (files.length === 1) {
    myContainer.removeChild(fileContainer);
    const fileReader = new FileReader();
    fileReader.onload = function onLoad(e) {
      reader.parseAsText(fileReader.result);
      update();
    };
    fileReader.readAsText(files[0]);
  }
}

fileInput.addEventListener('change', handleFile);
