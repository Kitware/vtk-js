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
