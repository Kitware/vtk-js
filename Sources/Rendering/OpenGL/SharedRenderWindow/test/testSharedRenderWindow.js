import test from 'tape';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';
import vtkSharedRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/SharedRenderWindow';
import { GET_UNDERLYING_CONTEXT } from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow/ContextProxy';

import baseline from '../../../Core/RenderWindow/test/testMultipleRenderers.png';
import baseline2 from '../../../Core/RenderWindow/test/testMultipleRenderers2.png';

test.onlyIfWebGL('Test shared render window from existing context', (t) => {
  const gc = testUtils.createGarbageCollector();

  // Create some control UI
  const container = document.querySelector('body');
  const renderWindowContainer = gc.registerDOMElement(
    document.createElement('div')
  );
  container.appendChild(renderWindowContainer);

  // create what we will view
  const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());

  // Upper renderer
  const upperRenderer = gc.registerResource(vtkRenderer.newInstance());
  upperRenderer.setViewport(0, 0.5, 1, 1);
  renderWindow.addRenderer(upperRenderer);
  upperRenderer.setBackground(0.32, 0.34, 0.43);

  const coneActor = gc.registerResource(vtkActor.newInstance());
  upperRenderer.addActor(coneActor);

  const coneMapper = gc.registerResource(vtkMapper.newInstance());
  coneActor.setMapper(coneMapper);

  const coneSource = gc.registerResource(
    vtkConeSource.newInstance({ height: 1.0 })
  );
  coneMapper.setInputConnection(coneSource.getOutputPort());

  // Lower left renderer
  const lowerLeftRenderer = gc.registerResource(vtkRenderer.newInstance());
  lowerLeftRenderer.setViewport(0, 0, 0.5, 0.5);
  renderWindow.addRenderer(lowerLeftRenderer);
  lowerLeftRenderer.setBackground(0, 0.5, 0);

  const sphereActor = gc.registerResource(vtkActor.newInstance());
  lowerLeftRenderer.addActor(sphereActor);

  const sphereMapper = gc.registerResource(vtkMapper.newInstance());
  sphereActor.setMapper(sphereMapper);

  const sphereSource = gc.registerResource(vtkSphereSource.newInstance());
  sphereMapper.setInputConnection(sphereSource.getOutputPort());

  // Lower right renderer
  const lowerRightRenderer = gc.registerResource(vtkRenderer.newInstance());
  lowerRightRenderer.setViewport(0.5, 0, 1, 0.5);
  renderWindow.addRenderer(lowerRightRenderer);
  lowerRightRenderer.setBackground(0, 0, 0.5);

  const cubeActor = gc.registerResource(vtkActor.newInstance());
  lowerRightRenderer.addActor(cubeActor);

  const cubeMapper = gc.registerResource(vtkMapper.newInstance());
  cubeActor.setMapper(cubeMapper);

  const cubeSource = gc.registerResource(vtkCubeSource.newInstance());
  cubeMapper.setInputConnection(cubeSource.getOutputPort());

  const glWindow = gc.registerResource(renderWindow.newAPISpecificView());
  glWindow.setContainer(renderWindowContainer);
  renderWindow.addView(glWindow);
  glWindow.setSize(400, 400);

  // Force context creation on the OpenGL render window
  const glProxy = glWindow.get3DContext();
  const gl = glProxy?.[GET_UNDERLYING_CONTEXT]?.();
  t.ok(gl, 'Shared WebGL context created');

  const sharedWindow = gc.registerResource(
    vtkSharedRenderWindow.createFromContext(glWindow.getCanvas(), gl)
  );
  sharedWindow.setAutoClear(true);
  sharedWindow.setSize(400, 400);

  renderWindow.removeView(glWindow);
  renderWindow.addView(sharedWindow);

  upperRenderer.resetCamera();
  lowerLeftRenderer.resetCamera();
  lowerRightRenderer.resetCamera();

  const promise = sharedWindow
    .captureNextImage()
    .then((image) =>
      testUtils.compareImages(
        image,
        [baseline, baseline2],
        'Rendering/OpenGL/SharedRenderWindow/testSharedRenderWindow',
        t,
        5
      )
    )
    .finally(gc.releaseResources);
  sharedWindow.renderShared();
  return promise;
});

test.onlyIfWebGL(
  'Test shared render window keeps vtkSharedRenderer local to its factory',
  (t) => {
    const gc = testUtils.createGarbageCollector();
    const container = document.querySelector('body');

    const sharedContainer = gc.registerDOMElement(
      document.createElement('div')
    );
    container.appendChild(sharedContainer);

    const sharedRenderWindow = gc.registerResource(
      vtkRenderWindow.newInstance()
    );
    const sharedRenderer = gc.registerResource(vtkRenderer.newInstance());
    sharedRenderWindow.addRenderer(sharedRenderer);

    const sharedGlWindow = gc.registerResource(
      sharedRenderWindow.newAPISpecificView()
    );
    sharedGlWindow.setContainer(sharedContainer);
    sharedRenderWindow.addView(sharedGlWindow);
    sharedGlWindow.setSize(200, 200);

    const sharedGlProxy = sharedGlWindow.get3DContext();
    const sharedGl = sharedGlProxy?.[GET_UNDERLYING_CONTEXT]?.();
    t.ok(sharedGl, 'Shared-context source window created');

    const sharedWindow = gc.registerResource(
      vtkSharedRenderWindow.createFromContext(
        sharedGlWindow.getCanvas(),
        sharedGl
      )
    );
    sharedRenderWindow.removeView(sharedGlWindow);
    sharedRenderWindow.addView(sharedWindow);
    sharedRenderWindow.render();

    const sharedRendererNode = sharedWindow.getViewNodeFor(sharedRenderer);
    t.ok(
      sharedRendererNode?.isA('vtkSharedRenderer'),
      'Shared window uses vtkSharedRenderer'
    );

    const normalContainer = gc.registerDOMElement(
      document.createElement('div')
    );
    container.appendChild(normalContainer);

    const normalRenderWindow = gc.registerResource(
      vtkRenderWindow.newInstance()
    );
    const normalRenderer = gc.registerResource(vtkRenderer.newInstance());
    normalRenderWindow.addRenderer(normalRenderer);

    const normalGlWindow = gc.registerResource(
      normalRenderWindow.newAPISpecificView()
    );
    normalGlWindow.setContainer(normalContainer);
    normalRenderWindow.addView(normalGlWindow);
    normalGlWindow.setSize(200, 200);
    normalRenderWindow.render();

    const normalRendererNode = normalGlWindow.getViewNodeFor(normalRenderer);
    t.ok(
      normalRendererNode?.isA('vtkOpenGLRenderer'),
      'Normal window keeps vtkOpenGLRenderer'
    );
    t.notOk(
      normalRendererNode?.isA('vtkSharedRenderer'),
      'Normal window does not inherit vtkSharedRenderer'
    );

    gc.releaseResources();
    t.end();
  }
);

test.onlyIfWebGL('Test shared render window rejects WebGL1 contexts', (t) => {
  const canvas = document.createElement('canvas');
  const gl =
    canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  if (!gl) {
    t.pass('WebGL1 unavailable in this environment');
    t.end();
    return;
  }

  t.throws(
    () => vtkSharedRenderWindow.createFromContext(canvas, gl),
    /WebGL2 context/,
    'createFromContext rejects WebGL1 contexts'
  );
  t.end();
});

test.onlyIfWebGL(
  'Test shared render window does not manage external canvas DOM state',
  (t) => {
    const gc = testUtils.createGarbageCollector();
    const container = document.querySelector('body');
    const renderWindowContainer = gc.registerDOMElement(
      document.createElement('div')
    );
    container.appendChild(renderWindowContainer);

    const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
    const renderer = gc.registerResource(vtkRenderer.newInstance());
    renderWindow.addRenderer(renderer);

    const glWindow = gc.registerResource(renderWindow.newAPISpecificView());
    glWindow.setContainer(renderWindowContainer);
    renderWindow.addView(glWindow);
    glWindow.setSize(200, 200);

    const glProxy = glWindow.get3DContext();
    const gl = glProxy?.[GET_UNDERLYING_CONTEXT]?.();
    t.ok(gl, 'Shared WebGL context created');

    const canvas = glWindow.getCanvas();
    canvas.style.display = 'inline-block';
    const originalWidth = canvas.width;
    const originalHeight = canvas.height;
    const originalDisplay = canvas.style.display;

    const sharedWindow = gc.registerResource(
      vtkSharedRenderWindow.createFromContext(canvas, gl)
    );
    renderWindow.removeView(glWindow);
    renderWindow.addView(sharedWindow);

    sharedWindow.setSize(123, 77);
    sharedWindow.setUseOffScreen(true);

    t.equal(canvas.width, originalWidth, 'External canvas width preserved');
    t.equal(canvas.height, originalHeight, 'External canvas height preserved');
    t.equal(
      canvas.style.display,
      originalDisplay,
      'External canvas display preserved'
    );

    t.throws(
      () =>
        sharedWindow.captureNextImage('image/png', {
          size: [100, 100],
        }),
      /manageCanvas=true/,
      'Resize capture rejects when canvas management is disabled'
    );

    gc.releaseResources();
    t.end();
  }
);
