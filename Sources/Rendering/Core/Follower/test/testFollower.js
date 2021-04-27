import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkFollower from 'vtk.js/Sources/Rendering/Core/Follower';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkOBJReader from 'vtk.js/Sources/IO/Misc/OBJReader';
import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';

import baseline from './testFollower.png';

test('Test Follower class', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkFollower');

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
  renderer.setBackground(0.1, 0.2, 0.4);

  // ----------------------------------------------------------------------------
  // Test code
  // ----------------------------------------------------------------------------
  const reader = gc.registerResource(
    vtkOBJReader.newInstance({ splitMode: 'usemtl' })
  );

  const mapper = gc.registerResource(vtkMapper.newInstance());
  mapper.setInputConnection(reader.getOutputPort());

  const actor = gc.registerResource(vtkFollower.newInstance());
  actor.setMapper(mapper);
  actor.setCamera(renderer.getActiveCamera());
  renderer.addActor(actor);

  reader
    .setUrl(
      `${__BASE_PATH__}/Data/obj/space-shuttle-orbiter/space-shuttle-orbiter.obj`
    )
    .then(() => {
      renderer.resetCamera();
      renderWindow.render();

      const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
      glwindow.setContainer(renderWindowContainer);
      renderWindow.addView(glwindow);
      glwindow.setSize(400, 400);

      renderer.getActiveCamera().azimuth(10);
      renderer.getActiveCamera().elevation(10);
      renderer.getActiveCamera().orthogonalizeViewUp();
      glwindow.captureNextImage().then((image) => {
        testUtils.compareImages(
          image,
          [baseline],
          'Rendering/Core/Follower/testFollower',
          t,
          1.5,
          gc.releaseResources
        );
      });
      renderWindow.render();
    });
});
