import { it, expect } from 'vitest';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkActor2D from 'vtk.js/Sources/Rendering/Core/Actor2D';
import vtkCoordinate from 'vtk.js/Sources/Rendering/Core/Coordinate';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkInteractorStyleTrackballCamera from 'vtk.js/Sources/Interaction/Style/InteractorStyleTrackballCamera';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkMapper2D from 'vtk.js/Sources/Rendering/Core/Mapper2D';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import { DisplayLocation } from 'vtk.js/Sources/Rendering/Core/Property2D/Constants';
import { Representation } from 'vtk.js/Sources/Rendering/Core/Property/Constants';

import baseline from './testRenderer3DAnd2DActors.png';

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'Test Renderer - 3D, ImageSlice, and 2D actors',
  () => {
    const gc = testUtils.createGarbageCollector();
    expect('rendering', 'vtkRenderer testRenderer3DAnd2DActors').toBeTruthy();

    // Create some control UI
    const container = document.querySelector('body');
    const renderWindowContainer = gc.registerDOMElement(
      document.createElement('div')
    );
    container.appendChild(renderWindowContainer);

    // Create render window and renderer
    const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
    const renderer = gc.registerResource(vtkRenderer.newInstance());
    renderWindow.addRenderer(renderer);
    renderer.setBackground(0.2, 0.2, 0.2);

    // -----------------------------------------------------------------------
    // 3D Actor: cone
    // -----------------------------------------------------------------------
    const coneSource = gc.registerResource(vtkConeSource.newInstance());
    coneSource.setResolution(60);
    coneSource.setRadius(8);
    coneSource.setHeight(16);

    const mapper3d = gc.registerResource(vtkMapper.newInstance());
    mapper3d.setInputConnection(coneSource.getOutputPort());

    const actor3d = gc.registerResource(vtkActor.newInstance());
    actor3d.setMapper(mapper3d);
    actor3d.setPosition(32, 32, 32);
    actor3d.getProperty().setColor(0.2, 0.6, 1.0);
    renderer.addActor(actor3d);

    // -----------------------------------------------------------------------
    // ImageSlice actor: axial slice through a synthetic RTAnalytic image
    // -----------------------------------------------------------------------
    const sampleImage = testUtils.createImage([64, 64, 64], [1, 1, 1]);

    const imageMapper = gc.registerResource(vtkImageMapper.newInstance());
    imageMapper.setInputData(sampleImage);
    imageMapper.setKSlice(32);

    const imageSliceActor = gc.registerResource(vtkImageSlice.newInstance());
    imageSliceActor.setMapper(imageMapper);
    imageSliceActor.getProperty().setColorWindow(255);
    imageSliceActor.getProperty().setColorLevel(127.5);
    renderer.addActor(imageSliceActor);

    // -----------------------------------------------------------------------
    // 2D Actor 1: sphere rendered in world coordinates, foreground layer
    // -----------------------------------------------------------------------
    const sphereSource1 = gc.registerResource(vtkSphereSource.newInstance());
    sphereSource1.setCenter(-12, 32, 32);
    sphereSource1.setRadius(8);
    sphereSource1.setThetaResolution(24);
    sphereSource1.setPhiResolution(24);

    const coord1 = vtkCoordinate.newInstance();
    coord1.setCoordinateSystemToWorld();

    const mapper2d1 = gc.registerResource(vtkMapper2D.newInstance());
    mapper2d1.setTransformCoordinate(coord1);
    mapper2d1.setScalarVisibility(false);
    mapper2d1.setInputConnection(sphereSource1.getOutputPort());

    const actor2d1 = gc.registerResource(vtkActor2D.newInstance());
    actor2d1.setMapper(mapper2d1);
    actor2d1.getProperty().setColor([0.9, 0.4, 0.1]);
    actor2d1.getProperty().setOpacity(0.8);
    actor2d1.getProperty().setDisplayLocation(DisplayLocation.FOREGROUND);
    actor2d1.getProperty().setRepresentation(Representation.SURFACE);
    actor2d1.setLayerNumber(1);
    renderer.addActor2D(actor2d1);

    // -----------------------------------------------------------------------
    // 2D Actor 2: sphere rendered in world coordinates, background layer
    // -----------------------------------------------------------------------
    const sphereSource2 = gc.registerResource(vtkSphereSource.newInstance());
    sphereSource2.setCenter(75, 32, 32);
    sphereSource2.setRadius(8);
    sphereSource2.setThetaResolution(24);
    sphereSource2.setPhiResolution(24);

    const coord2 = vtkCoordinate.newInstance();
    coord2.setCoordinateSystemToWorld();

    const mapper2d2 = gc.registerResource(vtkMapper2D.newInstance());
    mapper2d2.setTransformCoordinate(coord2);
    mapper2d2.setScalarVisibility(false);
    mapper2d2.setInputConnection(sphereSource2.getOutputPort());

    const actor2d2 = gc.registerResource(vtkActor2D.newInstance());
    actor2d2.setMapper(mapper2d2);
    actor2d2.getProperty().setColor([0.1, 0.8, 0.3]);
    actor2d2.getProperty().setOpacity(0.8);
    actor2d2.getProperty().setDisplayLocation(DisplayLocation.BACKGROUND);
    actor2d2.getProperty().setRepresentation(Representation.SURFACE);
    actor2d2.setLayerNumber(0);
    renderer.addActor2D(actor2d2);

    // -----------------------------------------------------------------------
    // 2D Actor 3: sphere in display (viewport pixel) coordinates, foreground
    // Positioned at the bottom-left corner of the viewport (75, 75) px
    // -----------------------------------------------------------------------
    const sphereSource3 = gc.registerResource(vtkSphereSource.newInstance());
    sphereSource3.setCenter(75, 75, 0);
    sphereSource3.setRadius(50);
    sphereSource3.setThetaResolution(24);
    sphereSource3.setPhiResolution(24);

    const coord3 = vtkCoordinate.newInstance();
    coord3.setCoordinateSystemToDisplay();

    const mapper2d3 = gc.registerResource(vtkMapper2D.newInstance());
    mapper2d3.setTransformCoordinate(coord3);
    mapper2d3.setScalarVisibility(false);
    mapper2d3.setInputConnection(sphereSource3.getOutputPort());

    const actor2d3 = gc.registerResource(vtkActor2D.newInstance());
    actor2d3.setMapper(mapper2d3);
    actor2d3.getProperty().setColor([0.9, 0.8, 0.1]);
    actor2d3.getProperty().setOpacity(0.9);
    actor2d3.getProperty().setDisplayLocation(DisplayLocation.FOREGROUND);
    actor2d3.getProperty().setRepresentation(Representation.SURFACE);
    actor2d3.setLayerNumber(2);
    renderer.addActor2D(actor2d3);

    // -----------------------------------------------------------------------
    // Verify actor counts before rendering
    // -----------------------------------------------------------------------
    const actors3d = renderer.getActors();
    expect(
      actors3d.length,
      'Renderer has one 3D actor and one ImageSlice'
    ).toBe(2);

    const actors2d = renderer.getActors2D();
    expect(actors2d.length, 'Renderer has exactly three 2D actors').toBe(3);

    // -----------------------------------------------------------------------
    // Render and compare baseline
    // -----------------------------------------------------------------------
    renderer.getActiveCamera().azimuth(20);
    renderer.resetCamera();

    const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
    glwindow.setContainer(renderWindowContainer);
    renderWindow.addView(glwindow);
    glwindow.setSize(400, 400);

    // Set up interactor for mouse-driven camera manipulation
    const interactor = gc.registerResource(
      vtkRenderWindowInteractor.newInstance()
    );
    interactor.setStillUpdateRate(0.01);
    interactor.setView(glwindow);
    interactor.initialize();
    interactor.bindEvents(renderWindowContainer);
    interactor.setInteractorStyle(
      vtkInteractorStyleTrackballCamera.newInstance()
    );

    // Expose objects for browser console inspection
    global.renderer = renderer;
    global.renderWindow = renderWindow;
    global.actor3d = actor3d;
    global.imageSliceActor = imageSliceActor;
    global.imageMapper = imageMapper;
    global.actor2d1 = actor2d1;
    global.actor2d2 = actor2d2;
    global.actor2d3 = actor2d3;

    const promise = glwindow
      .captureNextImage()
      .then((image) =>
        testUtils.compareImages(
          image,
          [baseline],
          'Rendering/Core/Actor2D/testRenderer3DAnd2DActors',
          1
        )
      )
      .finally(gc.releaseResources);
    renderWindow.render();
    return promise;
  }
);
