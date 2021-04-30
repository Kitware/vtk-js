import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkDracoReader from 'vtk.js/Sources/IO/Geometry/DracoReader';
import vtkResourceLoader from 'vtk.js/Sources/IO/Core/ResourceLoader';

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const reader = vtkDracoReader.newInstance();
const mapper = vtkMapper.newInstance({ scalarVisibility: false });
const actor = vtkActor.newInstance();

actor.setMapper(mapper);
mapper.setInputConnection(reader.getOutputPort());

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
// Import usage example
// ----------------------------------------------------------------------------

// import CreateDracoModule from 'draco3d/draco_decoder_nodejs';
// vtkDracoReader.setDracoDecoder(CreateDracoModule);
// reader
//   .setUrl('https://kitware.github.io/vtk-js-datasets/data/draco/throw_14.drc')
//   .then(update);

// ----------------------------------------------------------------------------
// Dynamic script loading from CDN
// ----------------------------------------------------------------------------

// Prevent error when draco try to set the export on module
window.module = {};

// Add new script tag with draco CDN
vtkResourceLoader
  .loadScript('https://unpkg.com/draco3d@1.3.4/draco_decoder_nodejs.js')
  .then(() => {
    // Set decoder function to the vtk reader
    vtkDracoReader.setDracoDecoder(window.CreateDracoModule);

    // Trigger data download
    reader
      .setUrl(
        'https://kitware.github.io/vtk-js-datasets/data/draco/throw_14.drc'
      )
      .then(update);
  });

// ----------------------------------------------------------------------------
// WASMLoader usage example (for better performance)
// ----------------------------------------------------------------------------

//  vtkResourceLoader
//    .loadScript('https://www.gstatic.com/draco/v1/decoders/draco_wasm_wrapper.js')
//    .then(() => {
//      vtkDracoReader
//        .setWasmBinary('https://www.gstatic.com/draco/v1/decoders/draco_decoder.wasm', 'draco_decoder.wasm')
//        .then(() => {
//          reader.setUrl('https://kitware.github.io/vtk-js-datasets/data/draco/throw_14.drc').then(update);
//        });
//    });

// ----------------------------------------------------------------------------
// Use a file reader to load a local file
// ----------------------------------------------------------------------------

//  const myContainer = document.querySelector('body');
//  const fileContainer = document.createElement('div');
//  fileContainer.innerHTML = '<input type="file" class="file"/>';
//  myContainer.appendChild(fileContainer);
//
//  const fileInput = fileContainer.querySelector('input');
//
//  function handleFile(event) {
//    event.preventDefault();
//    const dataTransfer = event.dataTransfer;
//    const files = event.target.files || dataTransfer.files;
//    if (files.length === 1) {
//      myContainer.removeChild(fileContainer);
//      const fileReader = new FileReader();
//      fileReader.onload = function onLoad(e) {
//        reader.parseAsArrayBuffer(fileReader.result);
//        update();
//      };
//      fileReader.readAsArrayBuffer(files[0]);
//    }
//  }
//
//  fileInput.addEventListener('change', handleFile);
