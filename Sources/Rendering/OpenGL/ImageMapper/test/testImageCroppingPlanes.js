import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkImageGridSource from 'vtk.js/Sources/Filters/Sources/ImageGridSource';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

import baselineNoRotation from './testImageCroppingPlanesNoRotation.png';
import baselineRotation from './testImageCroppingPlanesRotation.png';
import baselineRotationClipPlane from './testImageCroppingPlanesRotationClipPlane.png';

function testClippingPlanes(
  t,
  gridDirection,
  polyDataRotation,
  clipPlaneNormal,
  baseline,
  description
) {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkOpenGLImageMapper testImage');

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

  // ----------------------------------------------------------------------------
  // Test code
  // ----------------------------------------------------------------------------

  const gridSource = gc.registerResource(vtkImageGridSource.newInstance());
  const extent = 200;
  const spacing = 16;
  const origin = 8;
  gridSource.setDataExtent(0, extent, 0, extent, 0, 0);
  gridSource.setGridSpacing(spacing, spacing, 0);
  gridSource.setGridOrigin(origin, origin, 0);
  gridSource.setDataDirection(...gridDirection);

  const mapper = gc.registerResource(vtkImageMapper.newInstance());
  mapper.setInputConnection(gridSource.getOutputPort());

  const clipPlane = vtkPlane.newInstance();
  clipPlane.setOrigin([100.0, 0.0, 0.0]);
  clipPlane.setNormal(clipPlaneNormal);
  mapper.addClippingPlane(clipPlane);

  const actor = gc.registerResource(vtkImageSlice.newInstance());
  actor.getProperty().setColorWindow(255);
  actor.getProperty().setColorLevel(127);
  actor.getProperty().setOpacity(0.3);
  actor.setMapper(mapper);

  const position = [0.3, 0.0, 0.0];
  actor.setPosition(position);

  const polyData = vtkPolyData.newInstance();
  const polyMapper = vtkMapper.newInstance();
  polyMapper.addClippingPlane(clipPlane);
  polyMapper.setInputData(polyData);

  const polySideCount = parseInt(extent / spacing, 10);
  const polyPoints = new Float32Array(polySideCount * polySideCount * 3);
  let vertexIndex = 0;
  for (let i = 0; i < polySideCount; i++) {
    for (let j = 0; j < polySideCount; j++) {
      polyPoints[vertexIndex] = origin + i * spacing;
      polyPoints[vertexIndex + 1] = origin + j * spacing;
      polyPoints[vertexIndex + 2] = origin;
      vertexIndex += 3;
    }
  }

  function addLines(linesArray, offset, lineCount) {
    for (let i = 0; i < lineCount - 1; i++) {
      for (let j = 0; j < lineCount - 1; j++) {
        const start = i * lineCount + j + offset;
        linesArray.push(
          5,
          start,
          start + 1,
          (i + 1) * lineCount + j + 1 + offset,
          (i + 1) * lineCount + j + offset,
          start
        );
      }
    }
  }

  const polyActor = vtkActor.newInstance();
  polyActor.setMapper(polyMapper);
  polyActor.getProperty().setOpacity(1.0);
  polyActor.getProperty().setColor(1.0, 0.6, 0.6);

  polyActor.setPosition(position);

  const polyLines = [];
  addLines(polyLines, 0, polySideCount);

  const verts = new Uint32Array(polyPoints.length);
  verts.fill(1);
  for (let i = 0; i < polyPoints.length; i++) {
    verts[i * 2 + 1] = i;
  }
  polyData.getPoints().setData(polyPoints, 3);
  polyData.getVerts().setData(verts);
  polyData.getLines().setData(new Uint32Array(polyLines));

  // Applied with DataDirection on the grid
  polyActor.rotateZ(polyDataRotation);

  renderer.addActor(actor);
  renderer.addActor(polyActor);
  renderer.resetCamera();
  renderWindow.render();

  // create something to view it, in this case webgl
  const glwindow = gc.registerResource(vtkOpenGLRenderWindow.newInstance());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  glwindow.captureNextImage().then((image) => {
    testUtils.compareImages(
      image,
      [baseline],
      `Rendering/OpenGL/ImageMapper${description}`,
      t,
      3,
      gc.releaseResources
    );
  });

  renderWindow.render();
}

test.onlyIfWebGL('Test ImageMapper ClippingPlanes No Rotation', (t) => {
  const direction = [1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0];
  const rotation = 0.0;
  const clipPlaneNormal = [1.0, 0.0, 0.0];
  const description = 'NoRotation';
  testClippingPlanes(
    t,
    direction,
    rotation,
    clipPlaneNormal,
    baselineNoRotation,
    description
  );
});

test.onlyIfWebGL('Test ImageMapper ClippingPlanes Rotation', (t) => {
  const direction = [0.866, 0.5, 0, -0.5, 0.866, 0, 0, 0, 1];
  const rotation = 30.0;
  const clipPlaneNormal = [1.0, 0.0, 0.0];
  const description = 'Rotation';
  testClippingPlanes(
    t,
    direction,
    rotation,
    clipPlaneNormal,
    baselineRotation,
    description
  );
});

test.onlyIfWebGL('Test ImageMapper ClippingPlanes Rotation Clip Plane', (t) => {
  const direction = [0.866, 0.5, 0, -0.5, 0.866, 0, 0, 0, 1];
  const rotation = 30.0;
  const clipPlaneNormal = [0.707, 0.707, 0.0];
  const description = 'RotationClipPlane';
  testClippingPlanes(
    t,
    direction,
    rotation,
    clipPlaneNormal,
    baselineRotationClipPlane,
    description
  );
});
