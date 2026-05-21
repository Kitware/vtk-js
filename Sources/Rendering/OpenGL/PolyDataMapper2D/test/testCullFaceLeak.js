import { it, expect } from 'vitest';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkLineSource from 'vtk.js/Sources/Filters/Sources/LineSource';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkActor2D from 'vtk.js/Sources/Rendering/Core/Actor2D';
import vtkCoordinate from 'vtk.js/Sources/Rendering/Core/Coordinate';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkMapper2D from 'vtk.js/Sources/Rendering/Core/Mapper2D';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';

import { SlicingMode } from 'vtk.js/Sources/Rendering/Core/ImageMapper/Constants';

function createWhiteImage() {
  const image = vtkImageData.newInstance();
  image.setDimensions(16, 16, 1);
  image.getPointData().setScalars(
    vtkDataArray.newInstance({
      numberOfComponents: 1,
      values: new Uint8Array(16 * 16).fill(255),
    })
  );
  return image;
}

function createImageSlice(image) {
  const mapper = vtkImageMapper.newInstance();
  mapper.setInputData(image);
  mapper.setSlicingMode(SlicingMode.K);
  mapper.setSlice(0);

  const actor = vtkImageSlice.newInstance();
  actor.setMapper(mapper);
  actor.getProperty().setColorWindow(255);
  actor.getProperty().setColorLevel(127);

  return { actor, mapper };
}

// A leaking case enables CULL_FACE without restoring it. It returns the
// resources to register for cleanup and a function to add it to a renderer.
function makeLineActor2DCase() {
  const line = vtkLineSource.newInstance({
    point1: [2, 2, 0],
    point2: [14, 14, 0],
  });

  const coordinate = vtkCoordinate.newInstance();
  coordinate.setCoordinateSystemToWorld();

  const mapper = vtkMapper2D.newInstance();
  mapper.setInputConnection(line.getOutputPort());
  mapper.setTransformCoordinate(coordinate);
  mapper.setScalarVisibility(false);

  const actor = vtkActor2D.newInstance();
  actor.setMapper(mapper);

  return {
    resources: [actor, mapper, line, coordinate],
    addToRenderer: (renderer) => renderer.addActor2D(actor),
  };
}

function makeBackfaceCulledSphereCase() {
  const source = vtkSphereSource.newInstance({
    center: [7.5, 7.5, 0],
    radius: 1,
  });

  const mapper = vtkMapper.newInstance();
  mapper.setInputConnection(source.getOutputPort());

  const actor = vtkActor.newInstance();
  actor.setMapper(mapper);
  actor.getProperty().setBackfaceCulling(true);

  return {
    resources: [actor, mapper, source],
    addToRenderer: (renderer) => renderer.addActor(actor),
  };
}

function setCameraToBackFace(renderer) {
  const camera = renderer.getActiveCamera();
  camera.setParallelProjection(true);
  camera.setPosition(7.5, 7.5, -50);
  camera.setFocalPoint(7.5, 7.5, 0);
  camera.setViewUp(0, 1, 0);
  camera.setParallelScale(9);
  renderer.resetCameraClippingRange();
}

function addChildRenderWindow(
  parentRenderWindow,
  parentView,
  container,
  image
) {
  const renderWindow = vtkRenderWindow.newInstance();
  parentRenderWindow.addRenderWindow(renderWindow);

  const view = parentView.addMissingNode(renderWindow);
  renderWindow.addView(view);
  view.setContainer(container);
  view.setSize(64, 64);
  view.getCanvas().style.width = '64px';
  view.getCanvas().style.height = '64px';

  const renderer = vtkRenderer.newInstance();
  renderer.setBackground(0, 0, 0);
  renderWindow.addRenderer(renderer);

  const imageSlice = createImageSlice(image);
  renderer.addActor(imageSlice.actor);
  setCameraToBackFace(renderer);

  return { renderWindow, renderer, view, imageSlice };
}

function getCenterPixel(canvas) {
  const context = canvas.getContext('2d');
  const { data } = context.getImageData(
    Math.floor(canvas.width / 2),
    Math.floor(canvas.height / 2),
    1,
    1
  );
  return Array.from(data);
}

function isBright(pixel) {
  return pixel[0] > 128 && pixel[1] > 128 && pixel[2] > 128 && pixel[3] > 0;
}

// child1 shows an image only. child2 shows an image plus a leaking actor.
// Both children share one WebGL context. If the leaking actor's cull state
// is not cleaned up, child1's back-facing image quad is culled on re-render.
function runLeakTest(leakingCase) {
  const gc = testUtils.createGarbageCollector();
  const root = document.querySelector('body');
  const childContainer1 = gc.registerDOMElement(document.createElement('div'));
  const childContainer2 = gc.registerDOMElement(document.createElement('div'));
  root.appendChild(childContainer1);
  root.appendChild(childContainer2);

  const parentRenderWindow = gc.registerResource(vtkRenderWindow.newInstance());
  const parentView = gc.registerResource(
    parentRenderWindow.newAPISpecificView('WebGL')
  );
  parentRenderWindow.addView(parentView);
  parentView.initialize();

  const image = gc.registerResource(createWhiteImage());
  const child1 = addChildRenderWindow(
    parentRenderWindow,
    parentView,
    childContainer1,
    image
  );
  const child2 = addChildRenderWindow(
    parentRenderWindow,
    parentView,
    childContainer2,
    image
  );

  leakingCase.addToRenderer(child2.renderer);

  [
    child1.renderWindow,
    child1.renderer,
    child1.imageSlice.actor,
    child1.imageSlice.mapper,
    child2.renderWindow,
    child2.renderer,
    child2.imageSlice.actor,
    child2.imageSlice.mapper,
    ...leakingCase.resources,
  ].forEach((resource) => gc.registerResource(resource));

  parentView.resizeFromChildRenderWindows();

  parentRenderWindow.render();
  const firstRenderPixel = getCenterPixel(child1.view.getCanvas());
  expect(
    isBright(firstRenderPixel),
    `first child slice is visible on initial render (${firstRenderPixel})`
  ).toBe(true);

  parentRenderWindow.render();
  const secondRenderPixel = getCenterPixel(child1.view.getCanvas());
  expect(
    isBright(secondRenderPixel),
    `first child slice remains visible after leaking actor render (${secondRenderPixel})`
  ).toBe(true);

  gc.releaseResources();
}

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'Test PolyDataMapper2D cull face does not leak between child render windows',
  () => runLeakTest(makeLineActor2DCase())
);

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'Test 3D actor backface culling does not leak between child render windows',
  () => runLeakTest(makeBackfaceCulledSphereCase())
);
