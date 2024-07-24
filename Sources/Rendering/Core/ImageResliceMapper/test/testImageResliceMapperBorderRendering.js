import test from 'tape';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/OpenGL/Profiles/All';

import { SlabTypes } from 'vtk.js/Sources/Rendering/Core/ImageResliceMapper/Constants';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkImageProperty from 'vtk.js/Sources/Rendering/Core/ImageProperty';
import vtkImageResliceMapper from 'vtk.js/Sources/Rendering/Core/ImageResliceMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';

import baselineOrtho from './testImageResliceMapperBorderRenderingOrtho.png';
import baselineOblique from './testImageResliceMapperBorderRenderingOblique.png';

test.onlyIfWebGL('Test ImageResliceMapper', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok(
    'rendering',
    'vtkImageResliceMapper testImageResliceMapperBorderRendering'
  );

  // Create container
  const bodyElem = document.querySelector('body');
  const container = gc.registerDOMElement(document.createElement('div'));
  bodyElem.appendChild(container);

  const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
  const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
  glwindow.setContainer(container);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  const renderer = gc.registerResource(vtkRenderer.newInstance());
  renderWindow.addRenderer(renderer);

  // Opaque green for the background
  renderer.setBackground(0, 1, 0);

  const imageDimension = 4;

  const ppty = gc.registerResource(vtkImageProperty.newInstance());
  const mapper = gc.registerResource(vtkImageResliceMapper.newInstance());
  const slicePlane = gc.registerResource(vtkPlane.newInstance());
  mapper.setSlicePlane(slicePlane);
  mapper.setSlabType(SlabTypes.MAX);

  // Opaque red for out of volume rendering
  mapper.setBackgroundColor(1, 0, 0, 1);

  const actor = gc.registerResource(vtkImageSlice.newInstance());
  actor.setMapper(mapper);
  renderer.addActor(actor);

  const minScalar = 0;
  const maxScalar = 2 * imageDimension;

  ppty.setColorWindow(maxScalar - minScalar);
  ppty.setColorLevel(0.5 * (maxScalar + minScalar));

  const rgb = gc.registerResource(vtkColorTransferFunction.newInstance());
  rgb.addRGBPoint(minScalar, 0, 0, 0);
  rgb.addRGBPoint(maxScalar, 1, 1, 1);
  ppty.setRGBTransferFunction(rgb);

  const ofun = gc.registerResource(vtkPiecewiseFunction.newInstance());
  ofun.addPoint(minScalar, 1);
  ofun.addPoint(maxScalar, 1);
  ppty.setPiecewiseFunction(ofun);

  ppty.setInterpolationTypeToNearest();
  actor.setProperty(ppty);

  const imageData = gc.registerResource(vtkImageData.newInstance());

  imageData.setOrigin(1, 2, 3);
  imageData.setSpacing(4, 5, 6);
  imageData.setExtent(
    0,
    imageDimension - 1,
    0,
    imageDimension - 1,
    0,
    imageDimension - 1
  );
  const values = new Float32Array(imageDimension ** 3);
  for (let i = 0; i < imageDimension; ++i) {
    for (let j = 0; j < imageDimension; ++j) {
      for (let k = 0; k < imageDimension; ++k) {
        values[i + imageDimension * (j + imageDimension * k)] = i + k;
      }
    }
  }

  const scalars = gc.registerResource(
    vtkDataArray.newInstance({
      numberOfComponents: 1,
      values,
    })
  );
  scalars.setName('scalars');
  imageData.getPointData().setScalars(scalars);

  mapper.setInputData(imageData);

  renderer.getActiveCamera().elevation(90);
  renderer.getActiveCamera().dolly(1.5);
  renderer.resetCamera();
  renderer.resetCameraClippingRange();

  function strictBaselineTest(baseline) {
    return new Promise((resolve) => {
      glwindow.captureNextImage().then((image) => {
        testUtils.compareImages(
          image,
          [baseline],
          'Rendering/Core/ImageResliceMapper',
          t,
          {
            pixelThreshold: 0.001, // 0.1% (range is [0, 1])
            mismatchTolerance: 1, // 1% (raw percentage)
          },
          resolve
        );
      });
      renderWindow.render();
    });
  }

  async function runRegresionTests() {
    slicePlane.setOrigin([0, imageDimension - 0.5, 0]);
    slicePlane.setNormal(0, 1, 0);
    await strictBaselineTest(baselineOrtho);
    const sqrt2 = Math.sqrt(2);
    slicePlane.setOrigin(imageData.getCenter());
    slicePlane.setNormal(sqrt2, sqrt2, 0);
    await strictBaselineTest(baselineOblique);
    gc.releaseResources();
  }

  runRegresionTests();
});
