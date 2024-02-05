/* eslint-disable no-await-in-loop */
import vtkSkybox from 'vtk.js/Sources/Rendering/Core/Skybox';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkTexture from 'vtk.js/Sources/Rendering/Core/Texture';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';

import test from 'tape';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import baseline from './testSkybox.png';

test.onlyIfWebGL('Test vtkOpenGLSkybox Rendering', async (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('Rendering', 'Filter: OpenGLTexture');

  function onLoadedTextures(loadedTextures) {
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
    for (let i = 0; i < 6; i++) {
      const scalarName = loadedTextures[i]
        .getPointData()
        .getArrayByIndex(0)
        .getName();
      loadedTextures[i].getPointData().setActiveScalars(scalarName);
      texture.setInputData(loadedTextures[i], i);
    }

    const actor = gc.registerResource(vtkSkybox.newInstance());
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

  async function loadTextures(texturePathList) {
    const reader = gc.registerResource(
      vtkHttpDataSetReader.newInstance({ fetchGzip: true })
    );
    const textures = [];
    for (let i = 0; i < texturePathList.length; i++) {
      await reader.setUrl(texturePathList[i]);
      await reader.loadData();
      textures.push(reader.getOutputData());
    }
    return textures;
  }

  const path = `${__BASE_PATH__}/Data/skybox/mountains/`;
  const texturePathList = [];
  texturePathList.push(`${path}right.jpg`); // +x
  texturePathList.push(`${path}left.jpg`); // -x
  texturePathList.push(`${path}top.jpg`); // y
  texturePathList.push(`${path}bottom.jpg`); // -y
  texturePathList.push(`${path}back.jpg`); // +z
  texturePathList.push(`${path}front.jpg`); // -z is front from inside a cube

  return onLoadedTextures(await loadTextures(texturePathList));
});
