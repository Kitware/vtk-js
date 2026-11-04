import { it, expect } from 'vitest';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkGlyph3DMapper from 'vtk.js/Sources/Rendering/Core/Glyph3DMapper';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';

function makePolyDataFromPoints(coords) {
  const polyData = vtkPolyData.newInstance();
  polyData.getPoints().setData(Float32Array.from(coords), 3);
  return polyData;
}

function updatePoints(polyData, coords) {
  polyData.getPoints().setData(Float32Array.from(coords), 3);
  polyData.getPoints().modified();
  polyData.modified();
}

function makeLineGlyphSource() {
  const source = makePolyDataFromPoints([-0.5, 0, 0, 0.5, 0, 0]);
  source.setLines(
    vtkCellArray.newInstance({
      values: new Uint32Array([2, 0, 1]),
    })
  );
  return source;
}

function getActivePrimitiveCABOs(openGLRenderWindow, mapper) {
  const openGLMapper = openGLRenderWindow.getViewNodeFor(mapper);
  const primitives = openGLMapper.getReferenceByName('primitives');
  return primitives
    .map((primitive) => primitive.getCABO())
    .filter((cabo) => cabo.getElementCount() > 0);
}

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'Test vtkGlyph3DMapper clears source VBO shift/scale after shifted glyph centers',
  () => {
    const gc = testUtils.createGarbageCollector();

    const container = document.querySelector('body');
    const renderWindowContainer = gc.registerDOMElement(
      document.createElement('div')
    );
    container.appendChild(renderWindowContainer);

    const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
    const renderer = gc.registerResource(vtkRenderer.newInstance());
    renderWindow.addRenderer(renderer);

    const centers = gc.registerResource(
      makePolyDataFromPoints([10000000, 0, 0, 10000001, 0, 0])
    );
    const source = gc.registerResource(makeLineGlyphSource());
    const mapper = gc.registerResource(vtkGlyph3DMapper.newInstance());
    const actor = gc.registerResource(vtkActor.newInstance());

    mapper.setInputData(centers, 0);
    mapper.setInputData(source, 1);
    mapper.setScalarVisibility(false);

    actor.setMapper(mapper);
    renderer.addActor(actor);

    const openGLRenderWindow = gc.registerResource(
      renderWindow.newAPISpecificView()
    );
    openGLRenderWindow.setContainer(renderWindowContainer);
    renderWindow.addView(openGLRenderWindow);
    openGLRenderWindow.setSize(1, 1);

    renderWindow.render();

    const shiftedCABOs = getActivePrimitiveCABOs(openGLRenderWindow, mapper);
    expect(
      shiftedCABOs.length > 0,
      'glyph source VBOs were built'
    ).toBeTruthy();
    expect(
      shiftedCABOs.some((cabo) => cabo.getCoordShiftAndScaleEnabled()),
      'far glyph centers enable shift/scale on source VBOs'
    ).toBeTruthy();

    updatePoints(centers, [-0.5, 0, 0, 0.5, 0, 0]);
    renderWindow.render();

    const unshiftedCABOs = getActivePrimitiveCABOs(openGLRenderWindow, mapper);
    expect(
      unshiftedCABOs.every((cabo) => !cabo.getCoordShiftAndScaleEnabled()),
      'source VBO shift/scale is cleared once glyph centers no longer use it'
    ).toBeTruthy();

    gc.releaseResources();
  }
);

it.skipIf(__VTK_TEST_NO_WEBGL__).each([0, 1e6])(
  'Test vtkGlyph3DMapper renders a small glyph source at its true size (centers offset %d)',
  (offset) => {
    const gc = testUtils.createGarbageCollector();

    const container = document.querySelector('body');
    const renderWindowContainer = gc.registerDOMElement(
      document.createElement('div')
    );
    container.appendChild(renderWindowContainer);

    const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
    const renderer = gc.registerResource(
      vtkRenderer.newInstance({ background: [0, 0, 0] })
    );
    renderWindow.addRenderer(renderer);

    // A 2 cm square is small enough that the source VBO gets its own shift/scale.
    const h = 0.01;
    const source = gc.registerResource(
      makePolyDataFromPoints([-h, -h, 0, h, -h, 0, h, h, 0, -h, h, 0])
    );
    source.setPolys(
      vtkCellArray.newInstance({ values: new Uint32Array([4, 0, 1, 2, 3]) })
    );
    const centers = gc.registerResource(vtkPolyData.newInstance());
    centers
      .getPoints()
      .setData(
        Float64Array.from([offset - 0.25, 0, 0, offset + 0.25, 0, 0]),
        3
      );
    const mapper = gc.registerResource(vtkGlyph3DMapper.newInstance());
    const actor = gc.registerResource(vtkActor.newInstance());

    mapper.setInputData(centers, 0);
    mapper.setInputData(source, 1);
    mapper.setScaling(false);
    mapper.setScalarVisibility(false);
    actor.getProperty().setColor(1, 1, 1);
    actor.getProperty().setLighting(false);

    actor.setMapper(mapper);
    renderer.addActor(actor);

    const openGLRenderWindow = gc.registerResource(
      renderWindow.newAPISpecificView()
    );
    openGLRenderWindow.setContainer(renderWindowContainer);
    renderWindow.addView(openGLRenderWindow);
    const size = 100;
    openGLRenderWindow.setSize(size, size);

    // Parallel projection with a 1 x 1 view: each glyph covers 2 x 2 pixels.
    const camera = renderer.getActiveCamera();
    camera.setParallelProjection(true);
    camera.setParallelScale(0.5);
    camera.setPosition(offset, 0, 1);
    camera.setFocalPoint(offset, 0, 0);
    renderer.resetCameraClippingRange();
    renderWindow.render();

    // Rebuild without new glyph matrices, then force a re-upload of them.
    actor.getProperty().setColor(1, 1, 0.9);
    renderWindow.render();
    openGLRenderWindow
      .getViewNodeFor(mapper)
      .releaseGraphicsResources(openGLRenderWindow);
    renderWindow.render();

    const pixels = openGLRenderWindow.getPixelData(0, 0, size - 1, size - 1);
    let covered = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] > 127) {
        covered++;
      }
    }
    expect(covered, 'glyph pixels drawn').toBeGreaterThan(0);
    expect(covered, 'glyph pixels drawn').toBeLessThanOrEqual(2 * 4 * 4);

    gc.releaseResources();
  }
);
