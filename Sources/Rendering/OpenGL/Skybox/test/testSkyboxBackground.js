import vtkSkybox from 'vtk.js/Sources/Rendering/Core/Skybox';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkTexture from 'vtk.js/Sources/Rendering/Core/Texture';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';

import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import baseline from './testSkyboxBackground.png';

test.onlyIfWebGL('Test vtkOpenGLSkybox Background Rendering', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('Rendering', 'Filter: OpenGLTexture');

  function callBackfunction(loadedTexture) {
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

    glwindow.captureNextImage().then((image) => {
      testUtils.compareImages(
        image,
        [baseline],
        'Rendering/OpenGL/Skybox/',
        t,
        0.5,
        gc.releaseResources
      );
    });
    renderWindow.render();
  }

  // function to load texture
  function loadTexture(texturePath, endCallBack) {
    const reader = gc.registerResource(
      vtkHttpDataSetReader.newInstance({ fetchGzip: true })
    );
    reader.setUrl(texturePath).then(() => {
      reader.loadData().then(() => {
        const textureImage = reader.getOutputData();
        if (endCallBack) {
          // check if endcallback exists
          endCallBack(textureImage);
        }
      }); // end loadData
    }); // end set url
  }

  const path = `${__BASE_PATH__}/Data/skybox/mountains/right.jpg`;

  // It will contains all vtkImageData which will textured the cube
  loadTexture(path, callBackfunction);
});
