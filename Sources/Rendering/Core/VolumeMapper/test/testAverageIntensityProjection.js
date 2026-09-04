import { it, expect } from 'vitest';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Profiles/Volume';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import Constants from 'vtk.js/Sources/Rendering/Core/VolumeMapper/Constants';

import baseline from './testAverageIntensityProjection.png';
import baseline2 from './testAverageIntensityProjection2.png';

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'Test Average Intensity Projection Volume Rendering',
  async () => {
    const gc = testUtils.createGarbageCollector();
    expect('rendering', 'vtkVolumeMapper AverageIP').toBeTruthy();
    // testUtils.keepDOM();

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

    const actor = gc.registerResource(vtkVolume.newInstance());

    const mapper = gc.registerResource(vtkVolumeMapper.newInstance());
    mapper.setSampleDistance(0.7);
    mapper.setBlendMode(Constants.BlendMode.AVERAGE_INTENSITY_BLEND);

    actor.setMapper(mapper);

    const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });

    // create color and opacity transfer functions
    const ctfun = vtkColorTransferFunction.newInstance();
    ctfun.addRGBPoint(-3024, 0, 0, 0);
    ctfun.addRGBPoint(-637.62, 1, 1, 1);
    ctfun.addRGBPoint(700, 1, 1, 1);
    ctfun.addRGBPoint(3071, 1, 1, 1);
    ctfun.setMappingRange(500, 3000);

    const ofun = vtkPiecewiseFunction.newInstance();
    ofun.addPoint(-3024, 0);
    ofun.addPoint(-637.62, 0);
    ofun.addPoint(700, 0.5);
    ofun.addPoint(3071, 0.9);

    actor.getProperty().setRGBTransferFunction(0, ctfun);
    actor.getProperty().setScalarOpacity(0, ofun);
    actor.getProperty().setScalarOpacityUnitDistance(0, 4.5);
    actor.getProperty().setInterpolationTypeToFastLinear();

    mapper.setInputConnection(reader.getOutputPort());

    // now create something to view it
    const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
    glwindow.setContainer(renderWindowContainer);
    renderWindow.addView(glwindow);
    glwindow.setSize(400, 400);

    // Interactor
    const interactor = vtkRenderWindowInteractor.newInstance();
    interactor.setStillUpdateRate(0.01);
    interactor.setView(glwindow);
    interactor.initialize();
    interactor.bindEvents(renderWindowContainer);

    await reader.setUrl(`${__BASE_PATH__}/Data/volume/headsq.vti`);
    await reader.loadData();

    renderer.addVolume(actor);
    renderer.resetCamera();

    const promise = glwindow
      .captureNextImage()
      .then((image) =>
        testUtils.compareImages(
          image,
          [baseline],
          'Rendering/Core/VolumeMapper/testAverageIntensityProjection',
          {
            // be stricter here
            pixelThreshold: 0.01,
            mismatchTolerance: 1.0,
          }
        )
      )
      .finally(gc.releaseResources);
    renderWindow.render();
    return promise;
  }
);

function createSyntheticData() {
  const dims = [16, 16, 16];
  const imageData = vtkImageData.newInstance();
  imageData.setDimensions(...dims);
  imageData.setSpacing(1, 1, 1);
  imageData.setOrigin(0, 0, 0);

  const values = [16, 48, 80, 112, 144, 176, 208, 240];

  // -----------------------------------------------------------------------------
  // Fill the 8 subcubes:
  //
  //          z = upper half
  //
  //       +--------+--------+
  //       |  144   |  176   |
  //       |        |        |
  //       +--------+--------+
  //       |  208   |  240   |
  //       |        |        |
  //       +--------+--------+
  //
  //          z = lower half
  //
  //       +--------+--------+
  //       |   16   |   48   |
  //       |        |        |
  //       +--------+--------+
  //       |   80   |  112   |
  //       |        |        |
  //       +--------+--------+
  //
  // x: 0..7 / 8..15
  // y: 0..7 / 8..15
  // z: 0..7 / 8..15
  // -----------------------------------------------------------------------------

  const scalars = new Uint8Array(16 * 16 * 16);

  const index = (x, y, z) => x + y * 16 + z * 16 * 16;

  for (let z = 0; z < 16; z++) {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const xHalf = x >= 8 ? 1 : 0;
        const yHalf = y >= 8 ? 1 : 0;
        const zHalf = z >= 8 ? 1 : 0;

        // Map the octant to one of the 8 values.
        const octant = xHalf + 2 * yHalf + 4 * zHalf;

        scalars[index(x, y, z)] = values[octant];
      }
    }
  }

  imageData.getPointData().setScalars(
    vtkDataArray.newInstance({
      name: 'Scalars',
      numberOfComponents: 1,
      values: scalars,
    })
  );

  return imageData;
}

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'Test Average Intensity Projection Volume Rendering Synthetic Data',
  () => {
    const gc = testUtils.createGarbageCollector();

    const container = document.querySelector('body');

    const renderWindowContainer = gc.registerDOMElement(
      document.createElement('div')
    );

    renderWindowContainer.style.width = '400px';
    renderWindowContainer.style.height = '400px';

    container.appendChild(renderWindowContainer);

    // --------------------------------------------------------------------------
    // Volume
    // --------------------------------------------------------------------------

    const actor = gc.registerResource(vtkVolume.newInstance());
    const actorProperty = actor.getProperty();

    const mapper = gc.registerResource(vtkVolumeMapper.newInstance());

    actor.setMapper(mapper);

    mapper.setSampleDistance(1.8);

    // Average intensity
    mapper.setBlendMode(3);

    actorProperty.setPreferSizeOverAccuracy(true);

    const colorTransferFunction = gc.registerResource(
      vtkColorTransferFunction.newInstance()
    );
    colorTransferFunction.addRGBPoint(0, 0, 0, 0);
    colorTransferFunction.addRGBPoint(250, 1, 1, 1);
    actorProperty.setRGBTransferFunction(0, colorTransferFunction);

    const opacityFunction = gc.registerResource(
      vtkPiecewiseFunction.newInstance()
    );
    opacityFunction.addPoint(0.0, 1.0);
    opacityFunction.addPoint(250.0, 1.0);

    actorProperty.setScalarOpacity(0, opacityFunction);
    actorProperty.setScalarOpacityUnitDistance(0, 3.0);

    actorProperty.setInterpolationTypeToLinear();

    actorProperty.setShade(true);
    actorProperty.setAmbient(0.1);
    actorProperty.setDiffuse(0.9);
    actorProperty.setSpecular(0.2);
    actorProperty.setSpecularPower(10.0);

    mapper.setInputData(createSyntheticData());

    // --------------------------------------------------------------------------
    // Rendering
    // --------------------------------------------------------------------------

    const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());

    const renderer = gc.registerResource(vtkRenderer.newInstance());

    const glwindow = gc.registerResource(renderWindow.newAPISpecificView());

    glwindow.setContainer(renderWindowContainer);
    glwindow.setSize(400, 400);

    renderWindow.addView(glwindow);
    renderWindow.addRenderer(renderer);

    renderer.addVolume(actor);

    const interactor = vtkRenderWindowInteractor.newInstance();
    interactor.setView(glwindow);
    interactor.initialize();
    interactor.bindEvents(renderWindowContainer);
    interactor.setDesiredUpdateRate(15.0);

    renderer.resetCamera();
    renderer.getActiveCamera().elevation(-90);

    // --------------------------------------------------------------------------
    // Render / capture
    // --------------------------------------------------------------------------

    const promise = glwindow
      .captureNextImage({ size: [400, 400] })
      .then((image) =>
        testUtils.compareImages(
          image,
          [baseline2],
          'Rendering/Core/VolumeMapper/testAverageIntensityProjection2',
          {
            pixelThreshold: 0.02,
            mismatchTolerance: 1.0,
          }
        )
      )
      .finally(gc.releaseResources);

    renderWindow.render();

    return promise;
  }
);
