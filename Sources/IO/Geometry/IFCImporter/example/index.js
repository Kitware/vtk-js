import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkResourceLoader from '@kitware/vtk.js/IO/Core/ResourceLoader';
import vtkIFCImporter from '@kitware/vtk.js/IO/Geometry/IFCImporter';
import vtkURLExtract from '@kitware/vtk.js/Common/Core/URLExtract';

import controlPanel from './controller.html';

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const userParams = vtkURLExtract.extractURLParameters();
const url =
  userParams.fileURL ||
  'https://raw.githubusercontent.com/ThatOpen/engine_web-ifc/refs/heads/main/tests/ifcfiles/public/duplex.ifc';
const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
fullScreenRenderer.addController(controlPanel);

if (userParams.mergeGeometries === undefined) {
  userParams.mergeGeometries = true;
}
const mergeGeometriesCheckbox = document.querySelector('#mergeGeometries');
mergeGeometriesCheckbox.checked = Boolean(userParams.mergeGeometries);

const importer = vtkIFCImporter.newInstance({
  mergeGeometries: mergeGeometriesCheckbox.checked,
});

// ----------------------------------------------------------------------------
function update() {
  const renderer = fullScreenRenderer.getRenderer();
  const renderWindow = fullScreenRenderer.getRenderWindow();

  const resetCamera = renderer.resetCamera;
  const render = renderWindow.render;

  importer.onReady(() => {
    importer.importActors(renderer);
    resetCamera();
    render();
  });
}

// ----------------------------------------------------------------------------
// Importer usage example
// ----------------------------------------------------------------------------
vtkResourceLoader
  .loadScript('https://cdn.jsdelivr.net/npm/web-ifc@0.0.64/web-ifc-api-iife.js')
  .then(() => {
    // Pass WebIFC api to vtkIFCImporter
    vtkIFCImporter.setIFCAPI(window.WebIFC);

    // Trigger data download
    importer.setUrl(url).then(update);
  });

mergeGeometriesCheckbox.addEventListener('change', (evt) => {
  window.location = `?mergeGeometries=${evt.target.checked}`;
});
