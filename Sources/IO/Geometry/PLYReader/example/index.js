import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPLYReader from 'vtk.js/Sources/IO/Geometry/PLYReader';
import vtkTexture from 'vtk.js/Sources/Rendering/Core/Texture';

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

let renderer = null;
let renderWindow = null;
const reader = vtkPLYReader.newInstance();
const mapper = vtkMapper.newInstance({ scalarVisibility: false });
const actor = vtkActor.newInstance();

actor.setMapper(mapper);
mapper.setInputConnection(reader.getOutputPort());

// ----------------------------------------------------------------------------

function refresh() {
  if (renderer && renderWindow) {
    const resetCamera = renderer.resetCamera;
    const render = renderWindow.render;
    resetCamera();
    render();
  }
}

function update() {
  const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
  renderer = fullScreenRenderer.getRenderer();
  renderWindow = fullScreenRenderer.getRenderWindow();

  renderer.addActor(actor);

  actor.getMapper().setScalarVisibility(true);
  const clr = { r: 200 / 255.0, g: 200 / 255.0, b: 200 / 255.0 };
  actor.getProperty().setColor(clr.r, clr.g, clr.b);

  refresh();
}

// ----------------------------------------------------------------------------
// Use a file reader to load a local file
// ----------------------------------------------------------------------------

const myContainer = document.querySelector('body');
const fileContainer = document.createElement('div');
fileContainer.innerHTML =
  '<div>Select a ply file or a ply file with its texture file.<br/><input type="file" class="file" multiple/></div>';
myContainer.appendChild(fileContainer);

const fileInput = fileContainer.querySelector('input');

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
    myContainer.removeChild(fileContainer);
    handlePlyFile(files[0]);
  } else if (files.length > 1) {
    myContainer.removeChild(fileContainer);
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

// ----------------------------------------------------------------------------
// Use the reader to download a file
// ----------------------------------------------------------------------------

// reader.setUrl(`${__BASE_PATH__}/data/ply/mesh.ply`, { binary: true }).then(update);
