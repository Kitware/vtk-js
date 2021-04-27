import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkGenericRenderWindow from 'vtk.js/Sources/Rendering/Misc/GenericRenderWindow';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

import {
  pushMonitorGLContextCount,
  popMonitorGLContextCount,
} from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';

test('Test vtkGenericRenderWindow create/delete', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  // testUtils.keepDOM();

  const actor = gc.registerResource(vtkActor.newInstance());
  const mapper = gc.registerResource(vtkMapper.newInstance());
  const coneSource = gc.registerResource(vtkConeSource.newInstance());
  actor.setMapper(mapper);
  mapper.setInputConnection(coneSource.getOutputPort());

  pushMonitorGLContextCount((count) => {
    if (count > 16) {
      t.fail('Too much WebGL context have been created');
    }
  });

  // Create some control UI
  const container = document.querySelector('body');
  const images = [];

  function createRW() {
    const rwContainer = gc.registerDOMElement(document.createElement('div'));
    container.appendChild(rwContainer);

    const grw = vtkGenericRenderWindow.newInstance();
    grw.setContainer(rwContainer);
    grw.getRenderer().addActor(actor);

    images.push(grw.getOpenGLRenderWindow().captureNextImage());
    grw.getRenderWindow().render();

    grw.delete();

    if (images.length < 100) {
      setTimeout(createRW, 100);
    } else {
      popMonitorGLContextCount();
      Promise.all(images).then(gc.releaseResources);
    }
  }

  createRW();
});
