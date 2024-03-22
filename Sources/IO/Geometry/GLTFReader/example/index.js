import 'vtk.js/Sources/Rendering/Profiles/Geometry';

// Enable data soure for DataAccessHelper
import 'vtk.js/Sources/IO/Core/DataAccessHelper/LiteHttpDataAccessHelper'; // Just need HTTP
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper'; // HTTP + zip
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/HtmlDataAccessHelper'; // html + base64 + zip
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/JSZipDataAccessHelper'; // zip

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkGLTFReader from 'vtk.js/Sources/IO/Geometry/GLTFReader';

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

const reader = vtkGLTFReader.newInstance({
  renderer,
});

// ----------------------------------------------------------------------------

function update() {
  console.log('update');
  renderer.resetCamera();
  renderWindow.render();
}

// ----------------------------------------------------------------------------
// Use a file reader to load a local file
// ----------------------------------------------------------------------------

const myContainer = document.querySelector('body');
const fileContainer = document.createElement('div');
fileContainer.style.position = 'absolute';

fileContainer.innerHTML =
  '<input type="file" class="file" accept=".gltf, .glb"/>';
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
      reader.parseAsBinary(fileReader.result);
      reader.onReady(update);
    };
    fileReader.readAsArrayBuffer(files[0]);
  }
}

fileInput.addEventListener('change', handleFile);

// ----------------------------------------------------------------------------
// Use the reader to download a file
// ----------------------------------------------------------------------------

// reader.setUrl(`${__BASE_PATH__}/data/ply/mesh.ply`, { binary: true }).then(update);
