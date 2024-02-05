import test from 'tape';
import testUtils from 'vtk.js/Sources/Testing/testUtils';
import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';

import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';

import baseline from './testImageLabelOutline.png';

test('Test ImageMapper', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkImageMapper testImage');

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

  const BACKGROUND = 0;
  const LOW_VALUE = 80;
  const HIGH_VALUE = 160;

  function createLabelPipeline(backgroundImageData) {
    const labelMapData = gc.registerResource(
      vtkImageData.newInstance(
        backgroundImageData.get('spacing', 'origin', 'direction')
      )
    );

    labelMapData.computeTransforms();

    const values = new Uint8Array(backgroundImageData.getNumberOfPoints());

    const dataArray = gc.registerResource(
      vtkDataArray.newInstance({
        numberOfComponents: 1, // labelmap with single component
        values,
      })
    );

    labelMapData.getPointData().setScalars(dataArray);

    labelMapData.setDimensions(...backgroundImageData.getDimensions());
    labelMapData.setSpacing(...backgroundImageData.getSpacing());
    labelMapData.setOrigin(...backgroundImageData.getOrigin());
    labelMapData.setDirection(...backgroundImageData.getDirection());

    const mapper = gc.registerResource(vtkImageMapper.newInstance());

    mapper.setInputData(labelMapData);

    const actor = gc.registerResource(vtkImageSlice.newInstance());

    actor.setMapper(mapper);

    const labelMap = {
      actor,
      mapper,
      imageData: labelMapData,
      cfun: gc.registerResource(vtkColorTransferFunction.newInstance()),
      ofun: gc.registerResource(vtkPiecewiseFunction.newInstance()),
    };

    // Labelmap pipeline
    labelMap.mapper.setInputData(labelMapData);
    labelMap.actor.setMapper(labelMap.mapper);

    // Set up labelMap color and opacity mapping
    labelMap.cfun.addRGBPoint(0, 0, 0, 0); // label "1" will be red
    labelMap.cfun.addRGBPoint(1, 1, 0, 0); // label "1" will be red
    labelMap.cfun.addRGBPoint(5, 0, 1, 0); // label "5" will be green
    labelMap.ofun.addPoint(0, 0);
    labelMap.ofun.addPoint(1, 0.3);
    labelMap.ofun.addPoint(5, 0.3);
    labelMap.ofun.setClamping(false);

    labelMap.actor.getProperty().setRGBTransferFunction(0, labelMap.cfun);
    labelMap.actor.getProperty().setScalarOpacity(0, labelMap.ofun);
    labelMap.actor.getProperty().setInterpolationTypeToNearest();
    labelMap.actor.getProperty().setUseLabelOutline(true);
    labelMap.actor.getProperty().setUseLookupTableScalarRange(true);

    labelMap.actor.getProperty().setLabelOutlineThickness([1, 1, 1, 1, 5]);
    labelMap.actor.getProperty().setLabelOutlineOpacity(1.0);

    return labelMap;
  }

  function fillBlobForThreshold(imageData, backgroundImageData) {
    const dims = imageData.getDimensions();
    const values = imageData.getPointData().getScalars().getData();

    const backgroundValues = backgroundImageData
      .getPointData()
      .getScalars()
      .getData();
    const size = dims[0] * dims[1] * dims[2];

    // Head
    for (let i = 0; i < size; i++) {
      if (backgroundValues[i] === LOW_VALUE) {
        values[i] = 1;
      } else if (backgroundValues[i] === HIGH_VALUE) {
        values[i] = 5;
      }
    }

    imageData.getPointData().getScalars().setData(values);
  }

  // Create a one slice vtkImageData that has four quadrants of different values

  const imageData = gc.registerResource(vtkImageData.newInstance());
  const dims = [10, 10, 1];
  imageData.setSpacing(1, 1, 1);
  imageData.setOrigin(0.1, 0.1, 0.1);
  imageData.setDirection(1, 0, 0, 0, 1, 0, 0, 0, 1);
  imageData.setExtent(0, dims[0] - 1, 0, dims[1] - 1, 0, dims[2] - 1);

  imageData.computeTransforms();

  const values = new Uint8Array(dims[0] * dims[1] * dims[2]);

  let i = 0;
  for (let y = 0; y < dims[1]; y++) {
    for (let x = 0; x < dims[0]; x++, i++) {
      if ((x < 3 && y < 3) || (x > 7 && y > 7)) {
        values[i] = BACKGROUND;
      } else if (x > 4 && x < 6 && y > 4 && y < 7) {
        values[i] = LOW_VALUE;
      } else {
        values[i] = HIGH_VALUE;
      }
    }
  }

  const dataArray = gc.registerResource(
    vtkDataArray.newInstance({
      numberOfComponents: 1,
      values,
    })
  );

  imageData.getPointData().setScalars(dataArray);
  imageData.modified();

  const data = imageData;
  const labelMap = createLabelPipeline(data);

  fillBlobForThreshold(labelMap.imageData, data);

  const actor = gc.registerResource(vtkImageSlice.newInstance());
  const mapper = gc.registerResource(vtkImageMapper.newInstance());
  mapper.setInputData(data);
  actor.setMapper(mapper);
  actor.getProperty().setInterpolationTypeToNearest();

  renderer.addActor(actor);
  renderer.addActor(labelMap.actor);
  renderer.resetCamera();
  renderer.resetCameraClippingRange();
  renderWindow.render();

  // create something to view it
  const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  glwindow.captureNextImage().then((image) => {
    testUtils.compareImages(
      image,
      [baseline],
      'Rendering/Core/ImageMapperLabelOutline',
      t,
      1,
      gc.releaseResources
    );
  });
  renderWindow.render();
});
