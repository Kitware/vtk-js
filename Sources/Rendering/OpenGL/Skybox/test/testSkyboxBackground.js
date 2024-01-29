import vtkSkybox from 'vtk.js/Sources/Rendering/Core/Skybox';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkTexture from 'vtk.js/Sources/Rendering/Core/Texture';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';

import test from 'tape';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import baseline from './testSkyboxBackground.png';

test.onlyIfWebGL('Test vtkOpenGLSkybox Background Rendering', async (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('Rendering', 'Filter: OpenGLTexture');

  function onLoadedTexture(loadedTexture) {
    // Create come control UI
    const container = document.querySelector('body');
    const renderWindowContainer = gc.registerDOMElement(
      document.createElement('div')
    );
    container.appendChild(renderWindowContainer);

    // Create view
    const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
    const renderer = gc.registerResource(vtkRenderer.newInstance());
    renderWindow.addRenderer(renderer);

    const texture = gc.registerResource(vtkTexture.newInstance());
    const scalarName = loadedTexture
      .getPointData()
      .getArrayByIndex(0)
      .getName();
    loadedTexture.getPointData().setActiveScalars(scalarName);
    texture.setInputData(loadedTexture, 0);

    const actor = gc.registerResource(vtkSkybox.newInstance());
    actor.setFormat('background');
    actor.addTexture(texture);
    renderer.addActor(actor);

    const glwindow = gc.registerResource(vtkOpenGLRenderWindow.newInstance());
    glwindow.setContainer(renderWindowContainer);
    renderWindow.addView(glwindow);
    glwindow.setSize(400, 400);

    const promise = glwindow
      .captureNextImage()
      .then((image) =>
        testUtils.compareImages(
          image,
          [baseline],
          'Rendering/OpenGL/Skybox/',
          t,
          0.5,
          gc.releaseResources
        )
      );
    renderWindow.render();
    return promise;
  }

  // function to load texture
  async function loadTexture(texturePath) {
    const reader = gc.registerResource(
      vtkHttpDataSetReader.newInstance({ fetchGzip: true })
    );
    await reader.setUrl(texturePath);
    await reader.loadData();
    const textureImage = reader.getOutputData();
    return textureImage;
  }

  const path = `${__BASE_PATH__}/Data/skybox/mountains/right.jpg`;

  // It will contains all vtkImageData which will textured the cube
  return onLoadedTexture(await loadTexture(path));
});
