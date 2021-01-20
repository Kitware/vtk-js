import 'vtk.js/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpSceneLoader from 'vtk.js/IO/Core/HttpSceneLoader';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const sceneImporter = vtkHttpSceneLoader.newInstance({
  renderer,
  fetchGzip: true,
});
sceneImporter.setUrl(`${__BASE_PATH__}/data/scene`);
sceneImporter.onReady(() => {
  renderWindow.render();
});
