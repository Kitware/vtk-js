import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';

// Load the itk-wasm UMD module dynamically for the example.
// Normally, this will just go in the HTML <head>.
import vtkResourceLoader from 'vtk.js/Sources/IO/Core/ResourceLoader';
// Fetch the data. Other options include `fetch`, axios.
import vtkLiteHttpDataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper/LiteHttpDataAccessHelper';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

import vtkITKHelper from 'vtk.js/Sources/Common/DataModel/ITKHelper';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const mapper = vtkMapper.newInstance({ scalarVisibility: false });
const actor = vtkActor.newInstance();

actor.setMapper(mapper);
const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
renderer.addActor(actor);

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

async function update() {
  const meshArrayBuffer = await vtkLiteHttpDataAccessHelper.fetchBinary(
    'https://data.kitware.com/api/v1/file/5ce070b28d777f072bb5f8dd/download'
  );
  const { mesh, webWorker } = await window.itk.readMeshArrayBuffer(
    null,
    meshArrayBuffer,
    'bunny.obj'
  );
  const { polyData: itkPolyData } = await window.itk.meshToPolyData(
    webWorker,
    mesh
  );
  webWorker.terminate();

  const polyData = vtkITKHelper.convertItkToVtkPolyData(itkPolyData);
  mapper.setInputData(polyData);

  renderer.resetCamera();
  renderWindow.render();
}

// ----------------------------------------------------------------------------
// Dynamic script loading from CDN
// ----------------------------------------------------------------------------

// After the itk-wasm UMD script has been loaded, `window.itk` provides the itk-wasm API.
vtkResourceLoader
  .loadScript(
    'https://cdn.jsdelivr.net/npm/itk-wasm@1.0.0-b.8/dist/umd/itk-wasm.min.js'
  )
  .then(update);

global.mapper = mapper;
global.actor = actor;
global.renderer = renderer;
global.renderWindow = renderWindow;
