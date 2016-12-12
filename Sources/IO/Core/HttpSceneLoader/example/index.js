import vtkFullScreenRenderWindow from '../../../../../Sources/Testing/FullScreenRenderWindow';
import vtkHttpSceneLoader        from '../../../../../Sources/IO/Core/HttpSceneLoader';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const sceneImporter = vtkHttpSceneLoader.newInstance({ renderer, fetchGzip: true });
sceneImporter.setUrl(`${__BASE_PATH__}/data/scene`);
sceneImporter.onReady(() => {
  renderWindow.render();
});

