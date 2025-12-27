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

import baseline1 from './testImageResliceMapperDynamicInputs_1.png';
import baseline2 from './testImageResliceMapperDynamicInputs_2.png';
import baseline3 from './testImageResliceMapperDynamicInputs_3.png';
import baseline4 from './testImageResliceMapperDynamicInputs_4.png';

test.onlyIfWebGL('Test ImageResliceMapper Dynamic Inputs', async (t) => {
  const gc = testUtils.createGarbageCollector();
  t.ok(
    'rendering',
    'vtkImageResliceMapper testImageResliceMapperDynamicInputs'
  );

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
  renderer.setBackground(0.32, 0.34, 0.43);

  // Create background image property
  const bgPpty = gc.registerResource(vtkImageProperty.newInstance());
  bgPpty.setColorWindow(255);
  bgPpty.setColorLevel(127);
  bgPpty.setIndependentComponents(true);
  bgPpty.setInterpolationTypeToNearest();

  const bgRgb = gc.registerResource(vtkColorTransferFunction.newInstance());
  bgRgb.addRGBPoint(0, 0, 0, 0);
  bgRgb.addRGBPoint(255, 1, 1, 1);
  bgPpty.setRGBTransferFunction(bgRgb);

  // Create labelmap 1 property (red)
  const label1Ppty = gc.registerResource(vtkImageProperty.newInstance());
  label1Ppty.setIndependentComponents(true);
  label1Ppty.setUseLookupTableScalarRange(true);
  label1Ppty.setInterpolationTypeToNearest();
  label1Ppty.setUseLabelOutline(true);
  label1Ppty.setLabelOutlineThickness([2, 2]);
  label1Ppty.setLabelOutlineOpacity(1.0);

  const label1Rgb = gc.registerResource(vtkColorTransferFunction.newInstance());
  label1Rgb.addRGBPoint(0, 0, 0, 0);
  label1Rgb.addRGBPoint(1, 1, 0, 0); // Red
  label1Ppty.setRGBTransferFunction(label1Rgb);

  const label1Ofun = gc.registerResource(vtkPiecewiseFunction.newInstance());
  label1Ofun.addPoint(0, 0);
  label1Ofun.addPoint(1, 0.6);
  label1Ppty.setPiecewiseFunction(label1Ofun);

  // Create labelmap 2 property (green)
  const label2Ppty = gc.registerResource(vtkImageProperty.newInstance());
  label2Ppty.setIndependentComponents(true);
  label2Ppty.setUseLookupTableScalarRange(true);
  label2Ppty.setInterpolationTypeToNearest();
  label2Ppty.setUseLabelOutline(true);
  label2Ppty.setLabelOutlineThickness([2, 2]);
  label2Ppty.setLabelOutlineOpacity(1.0);

  const label2Rgb = gc.registerResource(vtkColorTransferFunction.newInstance());
  label2Rgb.addRGBPoint(0, 0, 0, 0);
  label2Rgb.addRGBPoint(1, 0, 1, 0); // Green
  label2Ppty.setRGBTransferFunction(label2Rgb);

  const label2Ofun = gc.registerResource(vtkPiecewiseFunction.newInstance());
  label2Ofun.addPoint(0, 0);
  label2Ofun.addPoint(1, 0.6);
  label2Ppty.setPiecewiseFunction(label2Ofun);

  // Create mapper and actor
  const mapper = gc.registerResource(vtkImageResliceMapper.newInstance());
  const slicePlane = gc.registerResource(vtkPlane.newInstance());
  slicePlane.setNormal(0, 0, 1);
  slicePlane.setOrigin(5, 5, 5);
  mapper.setSlicePlane(slicePlane);

  const actor = gc.registerResource(vtkImageSlice.newInstance());
  actor.setMapper(mapper);
  actor.setProperty(0, bgPpty);
  actor.setProperty(1, label1Ppty);
  actor.setProperty(2, label2Ppty);
  renderer.addActor(actor);

  // Create background image (10x10x10) with rotation around Z-axis
  const bgImage = gc.registerResource(vtkImageData.newInstance());
  const dims = [10, 10, 10];
  bgImage.setDimensions(...dims);
  bgImage.setSpacing(1, 1, 1);
  bgImage.setOrigin(0, 0, 0);
  // 15 degree rotation around Z-axis
  const cos15 = Math.cos((15 * Math.PI) / 180);
  const sin15 = Math.sin((15 * Math.PI) / 180);
  bgImage.setDirection([cos15, sin15, 0, -sin15, cos15, 0, 0, 0, 1]);

  const bgValues = new Uint8Array(dims[0] * dims[1] * dims[2]);
  let idx = 0;
  for (let z = 0; z < dims[2]; z++) {
    for (let y = 0; y < dims[1]; y++) {
      for (let x = 0; x < dims[0]; x++, idx++) {
        if (x < 3 && y < 3) {
          bgValues[idx] = 50;
        } else if (x > 6 && y > 6) {
          bgValues[idx] = 200;
        } else {
          bgValues[idx] = 125;
        }
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

  // Create labelmap 1 at same resolution with different origin and orientation (red rectangle)
  const label1Image = gc.registerResource(vtkImageData.newInstance());
  label1Image.setDimensions(...dims);
  label1Image.setSpacing(1, 1, 1);
  label1Image.setOrigin(0.5, -0.5, 0.25);
  // 10 degree rotation around Y-axis
  const cos10 = Math.cos((10 * Math.PI) / 180);
  const sin10 = Math.sin((10 * Math.PI) / 180);
  label1Image.setDirection([cos10, 0, -sin10, 0, 1, 0, sin10, 0, cos10]);

  const label1Values = new Uint8Array(dims[0] * dims[1] * dims[2]);
  idx = 0;
  for (let z = 0; z < dims[2]; z++) {
    for (let y = 0; y < dims[1]; y++) {
      for (let x = 0; x < dims[0]; x++, idx++) {
        if (x >= 1 && x < 4 && y >= 1 && y < 6) {
          label1Values[idx] = 1;
        } else {
          label1Values[idx] = 0;
        }
      }
    }
  }

  const label1Scalars = gc.registerResource(
    vtkDataArray.newInstance({
      numberOfComponents: 1,
      values: label1Values,
    })
  );
  label1Image.getPointData().setScalars(label1Scalars);

  // Create labelmap 2 at HALF resolution with different origin, spacing, and orientation (green rectangle)
  const label2Dims = [5, 5, 5];
  const label2Image = gc.registerResource(vtkImageData.newInstance());
  label2Image.setDimensions(...label2Dims);
  label2Image.setSpacing(2, 2, 2);
  label2Image.setOrigin(-1, 1, -0.5);
  // 20 degree rotation around X-axis
  const cos20 = Math.cos((20 * Math.PI) / 180);
  const sin20 = Math.sin((20 * Math.PI) / 180);
  label2Image.setDirection([1, 0, 0, 0, cos20, sin20, 0, -sin20, cos20]);

  const label2Values = new Uint8Array(
    label2Dims[0] * label2Dims[1] * label2Dims[2]
  );
  idx = 0;
  for (let z = 0; z < label2Dims[2]; z++) {
    for (let y = 0; y < label2Dims[1]; y++) {
      for (let x = 0; x < label2Dims[0]; x++, idx++) {
        if (x >= 2 && x < 5 && y >= 2 && y < 5) {
          label2Values[idx] = 1;
        } else {
          label2Values[idx] = 0;
        }
      }
    }
  }

  const label2Scalars = gc.registerResource(
    vtkDataArray.newInstance({
      numberOfComponents: 1,
      values: label2Values,
    })
  );
  label2Image.getPointData().setScalars(label2Scalars);

  // Setup camera
  const camera = renderer.getActiveCamera();
  camera.setPosition(5, 5, 20);
  camera.setFocalPoint(5, 5, 5);
  camera.setViewUp(0, 1, 0);
  renderer.resetCamera();

  // Test 1: Single input (background only)
  mapper.setInputData(bgImage, 0);
  const image1Promise = glwindow.captureNextImage();
  renderWindow.render();
  const image1 = await image1Promise;

  await testUtils.compareImages(
    image1,
    [baseline1],
    'Rendering/Core/ImageResliceMapper',
    t,
    1
  );

  // Test 2: Add first labelmap - triggers shader rebuild (1 -> 2 inputs)
  mapper.addInputData(label1Image);
  const image2Promise = glwindow.captureNextImage();
  renderWindow.render();
  const image2 = await image2Promise;

  await testUtils.compareImages(
    image2,
    [baseline2],
    'Rendering/Core/ImageResliceMapper',
    t,
    1
  );

  // Test 3: Add second labelmap with different resolution - triggers shader rebuild (2 -> 3 inputs)
  mapper.addInputData(label2Image);
  const image3Promise = glwindow.captureNextImage();
  renderWindow.render();
  const image3 = await image3Promise;

  await testUtils.compareImages(
    image3,
    [baseline3],
    'Rendering/Core/ImageResliceMapper',
    t,
    1
  );

  // Test 4a: Move labelmap 2 out of view by changing its origin
  label2Image.setOrigin(100, 100, 100); // Far away from slice plane
  label2Image.modified();
  const image4aPromise = glwindow.captureNextImage();
  renderWindow.render();
  const image4a = await image4aPromise;

  await testUtils.compareImages(
    image4a,
    [baseline2], // Should look like test 2 (bg + label1 only)
    'Rendering/Core/ImageResliceMapper',
    t,
    1
  );

  // Test 4b: Move labelmap 2 back into view
  label2Image.setOrigin(-1, 1, -0.5);
  label2Image.modified();
  const image4bPromise = glwindow.captureNextImage();
  renderWindow.render();
  const image4b = await image4bPromise;

  await testUtils.compareImages(
    image4b,
    [baseline3], // Should look like test 3 again
    'Rendering/Core/ImageResliceMapper',
    t,
    1
  );

  // Test 5: Remove all labelmaps - triggers shader rebuild (3 -> 1 input)
  mapper.setInputData(null, 1);
  mapper.setInputData(null, 2);
  const image5Promise = glwindow.captureNextImage();
  renderWindow.render();
  const image5 = await image5Promise;

  await testUtils.compareImages(
    image5,
    [baseline4],
    'Rendering/Core/ImageResliceMapper',
    t,
    1
  );

  gc.releaseResources();
});
