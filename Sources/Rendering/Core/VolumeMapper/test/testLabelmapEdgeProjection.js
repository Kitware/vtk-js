import { it, expect } from 'vitest';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import Constants from 'vtk.js/Sources/Rendering/Core/VolumeMapper/Constants';

import baseline from './testLabelmapEdgeProjection.png';

const { BlendMode } = Constants;

// Three segments side by side along x, each stored a hair off its whole
// number, as a sampled texture can return a label: 1 just under, 2 just over,
// 3 just under. Each segment's projected edge must take its own color.
const SEGMENTS = [
  { stored: 0.99, xRange: [4, 12] },
  { stored: 2.01, xRange: [16, 24] },
  { stored: 2.99, xRange: [28, 36] },
];

function createTwoComponentVolume() {
  const dims = [40, 40, 12];
  const numberOfPoints = dims[0] * dims[1] * dims[2];
  const values = new Float32Array(2 * numberOfPoints);
  for (let k = 0; k < dims[2]; k++) {
    for (let j = 0; j < dims[1]; j++) {
      for (let i = 0; i < dims[0]; i++) {
        const index = i + dims[0] * (j + dims[1] * k);
        // component 0: the image, a ramp along x
        values[2 * index] = 50 + 4 * i;
        // component 1: the segment labels
        const segment = SEGMENTS.find(
          ({ xRange }) =>
            i >= xRange[0] &&
            i < xRange[1] &&
            j >= 4 &&
            j < 36 &&
            k >= 3 &&
            k < 9
        );
        values[2 * index + 1] = segment ? segment.stored : 0;
      }
    }
  }

  const imageData = vtkImageData.newInstance();
  imageData.setDimensions(dims);
  imageData.getPointData().setScalars(
    vtkDataArray.newInstance({
      numberOfComponents: 2,
      values,
    })
  );
  return imageData;
}

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'Test Volume Rendering: labelmap edge projection rounds the labels',
  async () => {
    const gc = testUtils.createGarbageCollector();
    expect('rendering', 'vtkVolumeMapper LabelmapEdgeProjection').toBeTruthy();

    const container = document.querySelector('body');
    const renderWindowContainer = gc.registerDOMElement(
      document.createElement('div')
    );
    container.appendChild(renderWindowContainer);

    const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
    const renderer = gc.registerResource(vtkRenderer.newInstance());
    renderWindow.addRenderer(renderer);
    renderer.setBackground(0, 0, 0);

    const volume = gc.registerResource(vtkVolume.newInstance());
    const mapper = gc.registerResource(vtkVolumeMapper.newInstance());
    mapper.setSampleDistance(0.5);
    mapper.setBlendMode(BlendMode.LABELMAP_EDGE_PROJECTION_BLEND);
    mapper.setInputData(createTwoComponentVolume());
    volume.setMapper(mapper);

    const property = volume.getProperty();
    property.setIndependentComponents(true);

    const imageColor = gc.registerResource(
      vtkColorTransferFunction.newInstance()
    );
    imageColor.addRGBPoint(0, 0, 0, 0);
    imageColor.addRGBPoint(255, 1, 1, 1);
    const imageOpacity = gc.registerResource(
      vtkPiecewiseFunction.newInstance()
    );
    imageOpacity.addPoint(0, 1);
    imageOpacity.addPoint(255, 1);
    property.setRGBTransferFunction(0, imageColor);
    property.setScalarOpacity(0, imageOpacity);

    // segment 1 red, 2 green, 3 blue
    const labelColor = gc.registerResource(
      vtkColorTransferFunction.newInstance()
    );
    labelColor.addRGBPoint(0, 0, 0, 0);
    labelColor.addRGBPoint(1, 1, 0, 0);
    labelColor.addRGBPoint(2, 0, 1, 0);
    labelColor.addRGBPoint(3, 0, 0, 1);
    const labelOpacity = gc.registerResource(
      vtkPiecewiseFunction.newInstance()
    );
    labelOpacity.addPoint(0, 0);
    labelOpacity.addPoint(1, 1);
    labelOpacity.addPoint(3, 1);
    property.setRGBTransferFunction(1, labelColor);
    property.setScalarOpacity(1, labelOpacity);
    property.setForceNearestInterpolation(1, true);
    property.setLabelOutlineThickness(8);

    renderer.addVolume(volume);
    renderer.getActiveCamera().setParallelProjection(true);
    renderer.resetCamera();
    renderer.getActiveCamera().zoom(1.3);

    const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
    glwindow.setContainer(renderWindowContainer);
    renderWindow.addView(glwindow);
    glwindow.setSize(400, 400);

    const interactor = gc.registerResource(
      vtkRenderWindowInteractor.newInstance()
    );
    interactor.setView(glwindow);
    interactor.initialize();

    const promise = glwindow
      .captureNextImage()
      .then((image) =>
        testUtils.compareImages(
          image,
          [baseline],
          'Rendering/Core/VolumeMapper/testLabelmapEdgeProjection',
          1.5
        )
      );
    renderWindow.render();
    return promise;
  }
);
