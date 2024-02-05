/* eslint-disable no-await-in-loop */
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkTexture from 'vtk.js/Sources/Rendering/Core/Texture';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';

import test from 'tape';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import baseline from './testCreateCubeFromRawTexture.png';

test.onlyIfWebGL('Test vtkOpenGLTexture Rendering', async (t) => {
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

    const cube = gc.registerResource(vtkCubeSource.newInstance());
    cube.setGenerate3DTextureCoordinates(true);

    // Update shaders in order to map texture to a cube
    const mapper = gc.registerResource(vtkMapper.newInstance());
    mapper.setInputConnection(cube.getOutputPort());

    const actor = gc.registerResource(vtkActor.newInstance());
    actor.getProperty().setDiffuse(0.0);
    actor.getProperty().setAmbient(1.0);
    actor.setMapper(mapper);
    actor.addTexture(texture);
    renderer.addActor(actor);

    const glwindow = gc.registerResource(vtkOpenGLRenderWindow.newInstance());
    glwindow.setContainer(renderWindowContainer);
    renderWindow.addView(glwindow);
    glwindow.setSize(400, 400);

    renderer.resetCamera();
    renderer.getActiveCamera().azimuth(-120);
    renderer.getActiveCamera().elevation(30);
    renderer.resetCameraClippingRange();

    const promise = glwindow
      .captureNextImage()
      .then((image) =>
        testUtils.compareImages(
          image,
          [baseline],
          'Rendering/OpenGL/Texture/',
          t,
          0.5,
          gc.releaseResources
        )
      );
    renderWindow.render();
    return promise;
  }

  async function loadTexture(texturePathList) {
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
  texturePathList.push(`${path}right.jpg`);
  texturePathList.push(`${path}left.jpg`);
  texturePathList.push(`${path}top.jpg`);
  texturePathList.push(`${path}bottom.jpg`);
  texturePathList.push(`${path}front.jpg`); // front is +z on a cube
  texturePathList.push(`${path}back.jpg`);

  return onLoadedTextures(await loadTexture(texturePathList));
});
