import { it, expect } from 'vitest';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkPlatonicSolidSource from 'vtk.js/Sources/Filters/Sources/PlatonicSolidSource';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import { SolidType } from 'vtk.js/Sources/Filters/Sources/PlatonicSolidSource/Constants';

import baseline1 from './testTetrahedron.png';
import baseline2 from './testCube.png';
import baseline3 from './testOctahedron.png';
import baseline4 from './testIcosahedron.png';
import baseline5 from './testDodecahedron.png';

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'Test vtkPlatonicSolidSource Tetrahedron Rendering',
  () => {
    const gc = testUtils.createGarbageCollector();
    expect('rendering').toBeTruthy();

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
    renderer.setBackground(0.32, 0.34, 0.43);

    const actor = gc.registerResource(vtkActor.newInstance());

    renderer.addActor(actor);

    const mapper = gc.registerResource(vtkMapper.newInstance());
    actor.setMapper(mapper);

    const regularPolygonSource = gc.registerResource(
      vtkPlatonicSolidSource.newInstance()
    );
    mapper.setInputConnection(regularPolygonSource.getOutputPort());
    actor.rotateX(-30);

    // now create something to view it, in this case webgl
    const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
    glwindow.setContainer(renderWindowContainer);
    renderWindow.addView(glwindow);
    glwindow.setSize(400, 400);

    const promise = glwindow
      .captureNextImage()
      .then((image) =>
        testUtils.compareImages(
          image,
          [baseline1],
          'Filters/Sources/platonicSolidSource/testTetrahedron',
          2.5
        )
      )
      .finally(gc.releaseResources);
    renderWindow.render();
    return promise;
  }
);

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'Test vtkPlatonicSolidSource Cube Rendering',
  () => {
    const gc = testUtils.createGarbageCollector();
    expect('rendering').toBeTruthy();

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
    renderer.setBackground(0.32, 0.34, 0.43);

    const actor = gc.registerResource(vtkActor.newInstance());

    renderer.addActor(actor);

    const mapper = gc.registerResource(vtkMapper.newInstance());
    actor.setMapper(mapper);

    const regularPolygonSource = gc.registerResource(
      vtkPlatonicSolidSource.newInstance({
        solidType: SolidType.VTK_SOLID_CUBE,
      })
    );
    mapper.setInputConnection(regularPolygonSource.getOutputPort());
    actor.rotateX(-30);

    // now create something to view it, in this case webgl
    const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
    glwindow.setContainer(renderWindowContainer);
    renderWindow.addView(glwindow);
    glwindow.setSize(400, 400);

    const promise = glwindow
      .captureNextImage()
      .then((image) =>
        testUtils.compareImages(
          image,
          [baseline2],
          'Filters/Sources/platonicSolidSource/testCube',
          2.5
        )
      )
      .finally(gc.releaseResources);
    renderWindow.render();
    return promise;
  }
);

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'Test vtkPlatonicSolidSource Octahedron Rendering',
  () => {
    const gc = testUtils.createGarbageCollector();
    expect('rendering').toBeTruthy();

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
    renderer.setBackground(0.32, 0.34, 0.43);

    const actor = gc.registerResource(vtkActor.newInstance());

    renderer.addActor(actor);

    const mapper = gc.registerResource(vtkMapper.newInstance());
    actor.setMapper(mapper);

    const regularPolygonSource = gc.registerResource(
      vtkPlatonicSolidSource.newInstance({
        solidType: SolidType.VTK_SOLID_OCTAHEDRON,
      })
    );
    mapper.setInputConnection(regularPolygonSource.getOutputPort());
    actor.rotateX(-30);

    // now create something to view it, in this case webgl
    const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
    glwindow.setContainer(renderWindowContainer);
    renderWindow.addView(glwindow);
    glwindow.setSize(400, 400);

    const promise = glwindow
      .captureNextImage()
      .then((image) =>
        testUtils.compareImages(
          image,
          [baseline3],
          'Filters/Sources/platonicSolidSource/testOctahedron',
          2.5
        )
      )
      .finally(gc.releaseResources);
    renderWindow.render();
    return promise;
  }
);

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'Test vtkPlatonicSolidSource Icosahedron Rendering',
  () => {
    const gc = testUtils.createGarbageCollector();
    expect('rendering').toBeTruthy();

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
    renderer.setBackground(0.32, 0.34, 0.43);

    const actor = gc.registerResource(vtkActor.newInstance());

    renderer.addActor(actor);

    const mapper = gc.registerResource(vtkMapper.newInstance());
    actor.setMapper(mapper);

    const regularPolygonSource = gc.registerResource(
      vtkPlatonicSolidSource.newInstance({
        solidType: SolidType.VTK_SOLID_ICOSAHEDRON,
      })
    );
    mapper.setInputConnection(regularPolygonSource.getOutputPort());
    actor.rotateX(-30);

    // now create something to view it, in this case webgl
    const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
    glwindow.setContainer(renderWindowContainer);
    renderWindow.addView(glwindow);
    glwindow.setSize(400, 400);

    const promise = glwindow
      .captureNextImage()
      .then((image) =>
        testUtils.compareImages(
          image,
          [baseline4],
          'Filters/Sources/platonicSolidSource/testIcosahedron',
          2.5
        )
      )
      .finally(gc.releaseResources);
    renderWindow.render();
    return promise;
  }
);

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'Test vtkPlatonicSolidSource Dodecahedron Rendering',
  () => {
    const gc = testUtils.createGarbageCollector();
    expect('rendering').toBeTruthy();

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
    renderer.setBackground(0.32, 0.34, 0.43);

    const actor = gc.registerResource(vtkActor.newInstance());

    renderer.addActor(actor);

    const mapper = gc.registerResource(vtkMapper.newInstance());
    actor.setMapper(mapper);

    const regularPolygonSource = gc.registerResource(
      vtkPlatonicSolidSource.newInstance({
        solidType: SolidType.VTK_SOLID_DODECAHEDRON,
      })
    );
    mapper.setInputConnection(regularPolygonSource.getOutputPort());
    actor.rotateX(-30);

    // now create something to view it, in this case webgl
    const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
    glwindow.setContainer(renderWindowContainer);
    renderWindow.addView(glwindow);
    glwindow.setSize(400, 400);

    const promise = glwindow
      .captureNextImage()
      .then((image) =>
        testUtils.compareImages(
          image,
          [baseline5],
          'Filters/Sources/platonicSolidSource/testDodecahedron',
          2.5
        )
      )
      .finally(gc.releaseResources);
    renderWindow.render();
    return promise;
  }
);
