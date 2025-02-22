import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkMath from '@kitware/vtk.js/Common/Core/Math';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkGCodeReader from '@kitware/vtk.js/IO/Misc/GCodeReader';

import controlPanel from './controller.html';

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

let renderer = null;
let renderWindow = null;
let layersSelector = null;
let layersLabel = null;

const reader = vtkGCodeReader.newInstance();

// ----------------------------------------------------------------------------

function refresh() {
  if (renderer && renderWindow) {
    renderer.resetCamera();
    renderWindow.render();
  }
}

function update() {
  const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
  fullScreenRenderer.addController(controlPanel);
  layersSelector = document.querySelector('.layers');
  layersLabel = document.querySelector('.label');
  renderer = fullScreenRenderer.getRenderer();
  renderWindow = fullScreenRenderer.getRenderWindow();
  const numLayers = reader.getNumberOfOutputPorts();

  layersLabel.innerHTML = `Layers(${numLayers}):`;
  layersSelector.max = numLayers.toString();
  layersSelector.value = numLayers.toString();

  const actors = [];

  for (let idx = 1; idx < numLayers; idx++) {
    const polyData = reader.getOutputData(idx);
    if (polyData) {
      const mapper = vtkMapper.newInstance();
      mapper.setInputData(polyData);

      const actor = vtkActor.newInstance();
      actor.setMapper(mapper);

      const hue = idx / numLayers;
      const saturation = 0.8;
      const value = 1;
      const hsv = [hue, saturation, value];
      const rgb = [];
      vtkMath.hsv2rgb(hsv, rgb);
      actor.getProperty().setColor(rgb);
      actor.rotateX(-90);

      actors.push(actor);
    }
  }

  layersSelector.addEventListener('input', (event) => {
    const visibleLayers = parseInt(event.target.value, 10);
    actors.forEach((actor, index) => {
      actor.setVisibility(index < visibleLayers);
    });
    renderWindow.render();
  });

  actors.forEach((actor) => renderer.addActor(actor));
  refresh();
}

// ----------------------------------------------------------------------------
// Use a file reader to load a local file
// ----------------------------------------------------------------------------

const myContainer = document.querySelector('body');
const fileContainer = document.createElement('div');
fileContainer.innerHTML =
  '<div>Select a gcode file.<br/><input type="file" class="file"/></div>';
myContainer.appendChild(fileContainer);

const fileInput = fileContainer.querySelector('input');

function handleFile(event) {
  event.preventDefault();
  const dataTransfer = event.dataTransfer;
  const files = event.target.files || dataTransfer.files;
  myContainer.removeChild(fileContainer);
  const fileReader = new FileReader();
  fileReader.onload = function onLoad(e) {
    reader.parse(fileReader.result);
    update();
  };
  fileReader.readAsArrayBuffer(files[0]);
}

fileInput.addEventListener('change', handleFile);

// ----------------------------------------------------------------------------
// Use the reader to download a file
// ----------------------------------------------------------------------------
// reader.setUrl(`${__BASE_PATH__}/data/gcode/cube.gcode`, { binary: true }).then(update);
