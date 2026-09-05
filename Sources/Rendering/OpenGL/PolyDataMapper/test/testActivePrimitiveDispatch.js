import { describe, expect, it, onTestFinished } from 'vitest';

import testUtils from 'vtk.js/Sources/Testing/testUtils';
import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkGenericRenderWindow from 'vtk.js/Sources/Rendering/Misc/GenericRenderWindow';
import vtkSphereMapper from 'vtk.js/Sources/Rendering/Core/SphereMapper';

// Two triangles in the z = 0 plane, with a polyline along their bottom edge.
const POINTS = new Float32Array([
  -1, -0.5, 0, 0, -0.5, 0, -0.5, 0.5, 0, 1, -0.5, 0, 0.5, 0.5, 0,
]);
const LINES = new Uint16Array([3, 0, 1, 3]);
const POLYS = new Uint16Array([3, 0, 1, 2, 3, 1, 3, 4]);

function createScene() {
  const gc = testUtils.createGarbageCollector();
  onTestFinished(gc.releaseResources);
  const container = gc.registerDOMElement(document.createElement('div'));
  document.body.appendChild(container);
  const window = gc.registerResource(
    vtkGenericRenderWindow.newInstance({
      listenWindowResize: false,
      background: [0, 0, 0],
    })
  );
  window.setContainer(container);
  const renderer = window.getRenderer();
  const view = window.getApiSpecificRenderWindow();
  view.setSize(64, 64);

  const polyData = gc.registerResource(vtkPolyData.newInstance());
  polyData.getPoints().setData(POINTS, 3);
  polyData.getPolys().setData(POLYS);
  const mapper = gc.registerResource(vtkMapper.newInstance());
  mapper.setInputData(polyData);
  mapper.setScalarVisibility(false);
  const actor = gc.registerResource(vtkActor.newInstance());
  actor.setMapper(mapper);
  actor.getProperty().setLighting(false);
  actor.getProperty().setLineWidth(3);
  renderer.addActor(actor);
  const camera = renderer.getActiveCamera();
  camera.setPosition(0, 0, 5);
  camera.setFocalPoint(0, 0, 0);
  camera.setParallelProjection(true);
  camera.setParallelScale(2);
  renderer.resetCameraClippingRange();

  // These samples are inside filled geometry or a three-pixel-wide line.
  const isVisible = (x, y) => {
    window.getRenderWindow().render();
    const gl = view.getContext();
    const pixel = new Uint8Array(4);
    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    return pixel[0] > 128;
  };
  return { gc, view, polyData, mapper, actor, isVisible };
}

describe.skipIf(__VTK_TEST_NO_WEBGL__)('active primitive dispatch', () => {
  it('renders spheres after their first build and a rebuild', () => {
    const { gc, polyData, actor, isVisible } = createScene();
    const spheres = gc.registerResource(
      vtkSphereMapper.newInstance({ radius: 0.15 })
    );
    spheres.setInputData(polyData);
    actor.setMapper(spheres);
    expect(isVisible(48, 24)).toBe(true);
    polyData.getPoints().setData(POINTS.slice(0, 9), 3);
    expect(isVisible(48, 24)).toBe(false);
    expect(isVisible(16, 24)).toBe(true);
  });

  it('rebuilds after resource release and cell arrays empty or refill', () => {
    const { view, mapper, polyData, isVisible } = createScene();
    expect(isVisible(24, 29)).toBe(true);
    const { primitives } = view.getViewNodeFor(mapper).get('primitives');
    primitives.forEach((helper) => helper.releaseGraphicsResources());
    expect(isVisible(24, 29)).toBe(false);

    polyData.getPolys().setData(new Uint16Array());
    polyData.getLines().setData(LINES);
    expect(isVisible(24, 29)).toBe(false);
    expect(isVisible(40, 24)).toBe(true);
    polyData.getPolys().setData(POLYS);
    expect(isVisible(24, 29)).toBe(true);

    polyData.getLines().setData(new Uint16Array());
    polyData.getPolys().setData(new Uint16Array());
    expect(isVisible(24, 29)).toBe(false);
    polyData.getPolys().setData(POLYS);
    expect(isVisible(24, 29)).toBe(true);
  });
});
