import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkMath from '@kitware/vtk.js/Common/Core/Math';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkGCodeReader from '@kitware/vtk.js/IO/Misc/GCodeReader';

import GUI from 'lil-gui';

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

let renderer = null;
let renderWindow = null;
let gui = null;
let guiParams = null;
let actors = [];
let numLayers = 0;

const reader = vtkGCodeReader.newInstance();
let fileInputEl = null;

// ----------------------------------------------------------------------------

function refresh() {
  if (renderer && renderWindow) {
    renderer.resetCamera();
    renderWindow.render();
  }
}

function updateActors(visibleLayers) {
  actors.forEach((actor, index) => {
    actor.setVisibility(index < visibleLayers);
  });
  renderWindow.render();
}

function handleFileInput(file) {
  if (file) {
    const fileReader = new FileReader();
    fileReader.onload = function onLoad(e) {
      reader.parse(fileReader.result);
      // eslint-disable-next-line no-use-before-define
      update();
    };
    fileReader.readAsArrayBuffer(file);
  }
}

function createFileInput() {
  if (fileInputEl) {
    fileInputEl.remove();
  }
  fileInputEl = document.createElement('input');
  fileInputEl.type = 'file';
  fileInputEl.accept = '.gcode,.txt';
  fileInputEl.style.display = 'none';
  fileInputEl.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileInput(e.target.files[0]);
    }
    fileInputEl.value = '';
  });
  document.body.appendChild(fileInputEl);
}

function updateGUI() {
  if (gui) {
    gui.destroy();
  }
  gui = new GUI();
  guiParams = {
    numLayers,
    visibleLayers: numLayers,
    selectFile: () => {
      fileInputEl.click();
    },
  };
  gui.add(guiParams, 'numLayers').name('Number of Layers').listen().disable();
  gui
    .add(guiParams, 'visibleLayers', 1, numLayers, 1)
    .name('Show Layers')
    .onChange((value) => updateActors(value));
  gui.add(guiParams, 'selectFile').name('Select GCode File');
}

function update() {
  const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
  renderer = fullScreenRenderer.getRenderer();
  renderWindow = fullScreenRenderer.getRenderWindow();
  numLayers = reader.getNumberOfOutputPorts();

  actors = [];
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

  actors.forEach((actor) => renderer.addActor(actor));
  updateGUI();
  updateActors(numLayers);
  refresh();
}

// ----------------------------------------------------------------------------
// Setup GUI for file selection
// ----------------------------------------------------------------------------

function setupInitialGUI() {
  if (gui) {
    gui.destroy();
  }
  createFileInput();
  gui = new GUI();
  guiParams = {
    numLayers: 0,
    visibleLayers: 0,
    selectFile: () => {
      fileInputEl.click();
    },
  };
  gui.add(guiParams, 'numLayers').name('Number of Layers').listen().disable();
  gui.add(guiParams, 'visibleLayers').name('Show Layers').listen().disable();
  gui.add(guiParams, 'selectFile').name('Select GCode File');
}

setupInitialGUI();

// ----------------------------------------------------------------------------
// Use the reader to download a file
// ----------------------------------------------------------------------------
// reader.setUrl(`${__BASE_PATH__}/data/gcode/cube.gcode`, { binary: true }).then(update);
