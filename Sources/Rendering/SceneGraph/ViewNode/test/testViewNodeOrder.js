import { describe, expect, it } from 'vitest';
import macro from 'vtk.js/Sources/macros';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkActor2D from 'vtk.js/Sources/Rendering/Core/Actor2D';
import vtkCoordinate from 'vtk.js/Sources/Rendering/Core/Coordinate';
import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkMapper2D from 'vtk.js/Sources/Rendering/Core/Mapper2D';
import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';

const RED = [255, 0, 0];
const GREEN = [0, 255, 0];

// An actor that also lists other props as nested, as widgets do.
const newNestingActor = macro.newInstance((publicAPI, model, initialValues) => {
  vtkActor.extend(publicAPI, model, initialValues);
  publicAPI.getNestedProps = () => model.nestedProps;
});

function createScene() {
  const gc = testUtils.createGarbageCollector();
  const container = gc.registerDOMElement(document.createElement('div'));
  document.body.appendChild(container);
  const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
  const renderer = gc.registerResource(vtkRenderer.newInstance());
  renderWindow.addRenderer(renderer);
  renderer.setBackground(0, 0, 1);
  renderer.getActiveCamera().setPosition(0, 0, 10);
  const glWindow = gc.registerResource(renderWindow.newAPISpecificView());
  glWindow.setContainer(container);
  renderWindow.addView(glWindow);
  glWindow.setSize(100, 100);
  // Reads the center pixel in the same task, before the frame is presented.
  const renderCenter = () => {
    renderWindow.render();
    return Array.from(glWindow.getPixelData(50, 50, 50, 50).slice(0, 3));
  };
  return { gc, renderer, renderCenter };
}

function cube(gc, center, color = [1, 1, 1], actor = vtkActor.newInstance()) {
  const source = gc.registerResource(vtkCubeSource.newInstance({ center }));
  const mapper = gc.registerResource(vtkMapper.newInstance());
  mapper.setInputConnection(source.getOutputPort());
  gc.registerResource(actor);
  actor.setMapper(mapper);
  actor.getProperty().setColor(...color);
  actor.getProperty().setLighting(false);
  return actor;
}

// A 2D square over the whole view, so the center pixel shows the top layer.
function square(gc, color, layerNumber) {
  const source = gc.registerResource(
    vtkPlaneSource.newInstance({
      origin: [-5, -5, 0],
      point1: [5, -5, 0],
      point2: [-5, 5, 0],
    })
  );
  const coordinate = vtkCoordinate.newInstance();
  coordinate.setCoordinateSystemToWorld();
  const mapper = gc.registerResource(vtkMapper2D.newInstance());
  mapper.setTransformCoordinate(coordinate);
  mapper.setScalarVisibility(false);
  mapper.setInputConnection(source.getOutputPort());
  const actor = gc.registerResource(vtkActor2D.newInstance());
  actor.setMapper(mapper);
  actor.getProperty().setColor(...color);
  actor.setLayerNumber(layerNumber);
  return actor;
}

describe.skipIf(__VTK_TEST_NO_WEBGL__)('vtkViewNode child order', () => {
  it('draws actors removed and added back before the next render', () => {
    const { gc, renderer, renderCenter } = createScene();
    const center = cube(gc, [0, 0, 0], [1, 0, 0]);
    const right = cube(gc, [2, 0, 0]);
    renderer.addActor(center);
    renderer.addActor(cube(gc, [-2, 0, 0]));
    renderer.addActor(right);
    expect(renderCenter()).toEqual(RED);

    renderer.removeActor(center);
    renderer.removeActor(right);
    renderer.addActor(center);
    renderer.addActor(right);
    expect(renderCenter()).toEqual(RED);
  });

  it('draws an actor that another prop also lists as nested', () => {
    const { gc, renderer, renderCenter } = createScene();
    const shared = cube(gc, [0, 0, 0], [1, 0, 0]);
    const holder = newNestingActor({ nestedProps: [shared] });
    renderer.addActor(shared);
    renderer.addActor(cube(gc, [2, 0, 0], [1, 1, 1], holder));
    expect(renderCenter()).toEqual(RED);
  });

  it.each([
    ['after a 3D actor', true],
    ['with no 3D actor', false],
  ])('draws 2D layers in their new order %s', (label, withActor) => {
    const { gc, renderer, renderCenter } = createScene();
    if (withActor) renderer.addActor(cube(gc, [0, 0, 0]));
    const red = square(gc, [1, 0, 0], 0);
    const green = square(gc, [0, 1, 0], 1);
    renderer.addActor2D(red);
    renderer.addActor2D(green);
    expect(renderCenter()).toEqual(GREEN);

    red.setLayerNumber(2);
    expect(renderCenter()).toEqual(RED);
  });
});
