import test from 'tape';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/OpenGL/Profiles/All';

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

import baseline from './testImageResliceMapperLabelOutline.png';

test.onlyIfWebGL('Test ImageResliceMapper LabelOutline', async (t) => {
  const gc = testUtils.createGarbageCollector();
  t.ok('rendering', 'vtkImageResliceMapper testImageResliceMapperLabelOutline');

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
  renderer.setBackground(0.3, 0.3, 0.3);

  const imageDimension = 20;
  const labelmapDimension = 10; // Half resolution for labelmap

  // Background image property
  const bgPpty = gc.registerResource(vtkImageProperty.newInstance());
  bgPpty.setColorWindow(255);
  bgPpty.setColorLevel(127);
  bgPpty.setIndependentComponents(true);

  const bgRgb = gc.registerResource(vtkColorTransferFunction.newInstance());
  bgRgb.addRGBPoint(0, 0, 0, 0);
  bgRgb.addRGBPoint(255, 1, 1, 1);
  bgPpty.setRGBTransferFunction(bgRgb);

  const bgOfun = gc.registerResource(vtkPiecewiseFunction.newInstance());
  bgOfun.addPoint(0, 1);
  bgOfun.addPoint(255, 1);
  bgPpty.setPiecewiseFunction(bgOfun);

  // Labelmap property with outline
  const labelPpty = gc.registerResource(vtkImageProperty.newInstance());
  labelPpty.setIndependentComponents(true);
  labelPpty.setUseLookupTableScalarRange(true);
  labelPpty.setInterpolationTypeToNearest();
  labelPpty.setUseLabelOutline(true);
  labelPpty.setLabelOutlineThickness([1, 1, 1, 1]);
  labelPpty.setLabelOutlineOpacity(1.0);

  const labelRgb = gc.registerResource(vtkColorTransferFunction.newInstance());
  labelRgb.addRGBPoint(0, 0, 0, 0);
  labelRgb.addRGBPoint(1, 1, 0, 0); // Red
  labelRgb.addRGBPoint(2, 0, 1, 0); // Green
  labelPpty.setRGBTransferFunction(labelRgb);

  const labelOfun = gc.registerResource(vtkPiecewiseFunction.newInstance());
  labelOfun.addPoint(0, 0);
  labelOfun.addPoint(1, 0.3);
  labelOfun.addPoint(2, 0.3);
  labelPpty.setPiecewiseFunction(labelOfun);

  // Create mapper and actor
  const mapper = gc.registerResource(vtkImageResliceMapper.newInstance());
  const slicePlane = gc.registerResource(vtkPlane.newInstance());
  slicePlane.setNormal(0, 0, 1);
  mapper.setSlicePlane(slicePlane);

  const actor = gc.registerResource(vtkImageSlice.newInstance());
  actor.setMapper(mapper);
  actor.setProperty(0, bgPpty);
  actor.setProperty(1, labelPpty);
  renderer.addActor(actor);

  // Create background image with gradient
  const bgImage = gc.registerResource(vtkImageData.newInstance());
  bgImage.setDimensions(imageDimension, imageDimension, imageDimension);
  bgImage.setSpacing(1, 1, 1);
  bgImage.setOrigin(0, 0, 0);

  const bgValues = new Uint8Array(imageDimension ** 3);
  for (let k = 0; k < imageDimension; k++) {
    for (let j = 0; j < imageDimension; j++) {
      for (let i = 0; i < imageDimension; i++) {
        const idx = i + imageDimension * (j + imageDimension * k);
        bgValues[idx] = Math.floor(((i + j) / (2 * imageDimension)) * 255);
      }
    }
  }

  const bgScalars = gc.registerResource(
    vtkDataArray.newInstance({
      numberOfComponents: 1,
      values: bgValues,
    })
  );
  bgImage.getPointData().setScalars(bgScalars);

  // Create labelmap with two rectangular segments at HALF resolution
  const labelImage = gc.registerResource(vtkImageData.newInstance());
  labelImage.setDimensions(
    labelmapDimension,
    labelmapDimension,
    labelmapDimension
  );
  // Spacing is 2x to cover the same physical extent as the background image
  labelImage.setSpacing(2, 2, 2);
  labelImage.setOrigin(0, 0, 0);

  const labelValues = new Uint8Array(labelmapDimension ** 3);
  for (let k = 0; k < labelmapDimension; k++) {
    for (let j = 0; j < labelmapDimension; j++) {
      for (let i = 0; i < labelmapDimension; i++) {
        const idx = i + labelmapDimension * (j + labelmapDimension * k);
        // Segment 1: left rectangle (scaled coordinates for half resolution)
        if (i >= 1 && i < 4 && j >= 2 && j < 8) {
          labelValues[idx] = 1;
        }
        // Segment 2: right rectangle (scaled coordinates for half resolution)
        else if (i >= 6 && i < 9 && j >= 2 && j < 8) {
          labelValues[idx] = 2;
        } else {
          labelValues[idx] = 0;
        }
      }
    }
  }

  const labelScalars = gc.registerResource(
    vtkDataArray.newInstance({
      numberOfComponents: 1,
      values: labelValues,
    })
  );
  labelImage.getPointData().setScalars(labelScalars);

  // Set inputs: background as input 0, labelmap as input 1
  mapper.setInputData(bgImage, 0);
  mapper.addInputData(labelImage);

  slicePlane.setOrigin(bgImage.getCenter());

  renderer.resetCamera();
  renderer.getActiveCamera().dolly(1.2);
  renderer.resetCameraClippingRange();

  const promise = glwindow.captureNextImage().then((image) =>
    testUtils.compareImages(
      image,
      [baseline],
      'Rendering/Core/ImageResliceMapper',
      t,
      {
        pixelThreshold: 0.005,
        mismatchTolerance: 2,
      }
    )
  );
  renderWindow.render();
  await promise;

  gc.releaseResources();
});
