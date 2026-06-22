import { it, expect } from 'vitest';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkSphereMapper from 'vtk.js/Sources/Rendering/Core/SphereMapper';

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

function getActivePrimitiveCABOs(openGLRenderWindow, mapper) {
  const openGLMapper = openGLRenderWindow.getViewNodeFor(mapper);
  const primitives = openGLMapper.getReferenceByName('primitives');
  return primitives
    .map((primitive) => primitive.getCABO())
    .filter((cabo) => cabo.getElementCount() > 0);
}

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'Test vtkSphereMapper clears VBO shift/scale after shifted points',
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

    const polyData = gc.registerResource(
      makePolyDataFromPoints([10000000, 0, 0, 10000001, 0, 0])
    );
    const mapper = gc.registerResource(vtkSphereMapper.newInstance());
    const actor = gc.registerResource(vtkActor.newInstance());

    mapper.setInputData(polyData);
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
    expect(shiftedCABOs.length > 0, 'sphere VBOs were built').toBeTruthy();
    expect(
      shiftedCABOs.some((cabo) => cabo.getCoordShiftAndScaleEnabled()),
      'far points enable shift/scale on VBOs'
    ).toBeTruthy();

    updatePoints(polyData, [-0.5, 0, 0, 0.5, 0, 0]);
    renderWindow.render();

    const unshiftedCABOs = getActivePrimitiveCABOs(openGLRenderWindow, mapper);
    expect(
      unshiftedCABOs.every((cabo) => !cabo.getCoordShiftAndScaleEnabled()),
      'VBO shift/scale is cleared once points no longer use it'
    ).toBeTruthy();

    gc.releaseResources();
  }
);
