import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import GUI from 'lil-gui';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkSTLReader from '@kitware/vtk.js/IO/Geometry/STLReader';
import vtkPolyDataNormals from '@kitware/vtk.js/Filters/Core/PolyDataNormals';
// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const reader = vtkSTLReader.newInstance();
const mapper = vtkMapper.newInstance({ scalarVisibility: false });
const actor = vtkActor.newInstance();

actor.setMapper(mapper);
const normals = vtkPolyDataNormals.newInstance();
normals.setInputConnection(reader.getOutputPort());
mapper.setInputConnection(normals.getOutputPort());

// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
renderer.addActor(actor);

function update() {
  renderer.resetCamera();
  renderWindow.render();
}

// ----------------------------------------------------------------------------
// File handling
// ----------------------------------------------------------------------------

let lastLoadedArrayBuffer = null;

function parseCurrentBuffer() {
  if (!lastLoadedArrayBuffer) {
    return;
  }
  reader.parseAsArrayBuffer(lastLoadedArrayBuffer.slice(0));
  update();
}

const hiddenFileInput = document.createElement('input');
hiddenFileInput.type = 'file';
hiddenFileInput.accept = '.stl';
hiddenFileInput.style.display = 'none';
document.body.appendChild(hiddenFileInput);

function handleFile(event) {
  event.preventDefault();
  const dataTransfer = event.dataTransfer;
  const files = event.target.files || dataTransfer.files;
  if (files.length === 1) {
    const fileReader = new FileReader();
    fileReader.onload = function onLoad(e) {
      lastLoadedArrayBuffer = fileReader.result;
      parseCurrentBuffer();
    };
    fileReader.readAsArrayBuffer(files[0]);
  }
}

hiddenFileInput.addEventListener('change', handleFile);

// ----------------------------------------------------------------------------
// GUI
// ----------------------------------------------------------------------------

const settings = {
  merging: true,
  removeDuplicateVertices: -1,
  openFile() {
    hiddenFileInput.click();
  },
};

reader.setMerging(settings.merging);
reader.setRemoveDuplicateVertices(settings.removeDuplicateVertices);

const gui = new GUI({ title: 'Controls' });
gui
  .add(settings, 'merging')
  .name('merging')
  .onChange((value) => {
    reader.setMerging(value);
    parseCurrentBuffer();
  });
gui
  .add(settings, 'removeDuplicateVertices', -1, 12, 1)
  .name('removeDuplicateVertices')
  .onChange((value) => {
    reader.setRemoveDuplicateVertices(value);
    parseCurrentBuffer();
  });
gui.add(settings, 'openFile').name('Open STL...');

// ----------------------------------------------------------------------------
// Use the reader to download a file
// ----------------------------------------------------------------------------

fetch(`${__BASE_PATH__}/data/stl/suzanne.stl`)
  .then((response) => response.arrayBuffer())
  .then((arrayBuffer) => {
    lastLoadedArrayBuffer = arrayBuffer;
    parseCurrentBuffer();
  });
