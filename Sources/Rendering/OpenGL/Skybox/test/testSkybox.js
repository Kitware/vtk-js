import vtkSkybox from 'vtk.js/Sources/Rendering/Core/Skybox';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkTexture from 'vtk.js/Sources/Rendering/Core/Texture';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';

import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import baseline from './testSkybox.png';

test.onlyIfWebGL('Test vtkOpenGLSkybox Rendering', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('Rendering', 'Filter: OpenGLTexture');

  function callBackfunction(loadedTextures) {
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

    renderer.getActiveCamera().setViewUp(0, -1, 0);
    renderer.getActiveCamera().setFocalPoint(0, 0, 1);
    renderer.getActiveCamera().setPosition(0, 0, -50);
    renderer.resetCameraClippingRange();

    const glwindow = gc.registerResource(vtkOpenGLRenderWindow.newInstance());
    glwindow.setContainer(renderWindowContainer);
    renderWindow.addView(glwindow);
    glwindow.setSize(400, 400);

    const image = glwindow.captureImage();
    testUtils.compareImages(
      image,
      [baseline],
      'Rendering/OpenGL/Skybox/',
      t,
      0.5,
      gc.releaseResources
    );
  }

  // Recursive function to load texture one by one
  function loadTexture(
    idTexture,
    texturePathList,
    textureImageList,
    endCallBack
  ) {
    if (idTexture === texturePathList.length) {
      if (endCallBack) {
        // check if endcallback exists
        endCallBack(textureImageList);
      }
      return;
    }

    const reader = gc.registerResource(
      vtkHttpDataSetReader.newInstance({ fetchGzip: true })
    );
    reader.setUrl(texturePathList[idTexture]).then(() => {
      reader.loadData().then(() => {
        textureImageList.push(reader.getOutputData());
        const nextID = idTexture + 1;
        loadTexture(nextID, texturePathList, textureImageList, endCallBack);
      }); // end loadData
    }); // end set url
  }

  const path = `${__BASE_PATH__}/Data/skybox/mountains/`;
  const texturePathList = [];
  texturePathList.push(`${path}px.vti`);
  texturePathList.push(`${path}nx.vti`);
  texturePathList.push(`${path}py.vti`);
  texturePathList.push(`${path}ny.vti`);
  texturePathList.push(`${path}pz.vti`);
  texturePathList.push(`${path}nz.vti`);

  // It will contains all vtkImageData which will textured the cube
  const textures = [];
  loadTexture(0, texturePathList, textures, callBackfunction);
});
