import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkDracoReader from '@kitware/vtk.js/IO/Geometry/DracoReader';
import vtkResourceLoader from '@kitware/vtk.js/IO/Core/ResourceLoader';

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

// Add new script tag with draco CDN
vtkResourceLoader
  .loadScript('https://unpkg.com/draco3d@1.5.7/draco_decoder_nodejs.js')
  .then(async () => {
    // Set decoder function to the vtk reader
    // eslint-disable-next-line no-undef
    await vtkDracoReader.setDracoDecoder(DracoDecoderModule);
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
