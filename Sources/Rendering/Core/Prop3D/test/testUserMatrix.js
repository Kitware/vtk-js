import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkOBJReader from 'vtk.js/Sources/IO/Misc/OBJReader';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';

import { mat4 } from 'gl-matrix';

import baseline from './testUserMatrix.png';

test.onlyIfWebGL('Test Set Actor User Matrix', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkActor SetUserMatrix');

  // Create some control UI
  const container = document.querySelector('body');
  const renderWindowContainer = gc.registerDOMElement(
    document.createElement('div')
  );
  container.appendChild(renderWindowContainer);

  // create what we will view
  const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
  const renderer = gc.registerResource(vtkRenderer.newInstance());
  renderWindow.addRenderer(renderer);
  renderer.setBackground(0.0, 0.0, 0.0);

  // ----------------------------------------------------------------------------
  // Test code
  // ----------------------------------------------------------------------------
  const reader = gc.registerResource(
    vtkOBJReader.newInstance({ splitMode: 'usemtl' })
  );

  const mapper = gc.registerResource(vtkMapper.newInstance());
  mapper.setInputConnection(reader.getOutputPort());

  const actor = gc.registerResource(vtkActor.newInstance());
  actor.setMapper(mapper);
  renderer.addActor(actor);

  const userMatrix = mat4.create();
  mat4.rotateZ(userMatrix, userMatrix, Math.PI / 4);
  actor.setUserMatrix(userMatrix);

  actor.rotateZ(45);

  reader
    .setUrl(
      `${__BASE_PATH__}/Data/obj/space-shuttle-orbiter/space-shuttle-orbiter.obj`
    )
    .then(() => {
      renderer.resetCamera();
      renderWindow.render();

      const glwindow = gc.registerResource(vtkOpenGLRenderWindow.newInstance());
      glwindow.setContainer(renderWindowContainer);
      renderWindow.addView(glwindow);
      glwindow.setSize(400, 400);

      glwindow.captureNextImage().then((image) => {
        testUtils.compareImages(
          image,
          [baseline],
          'Rendering/Core/Prop3D/testUserMatrix',
          t,
          1.5,
          gc.releaseResources
        );
      });
      renderWindow.render();
    });
});
