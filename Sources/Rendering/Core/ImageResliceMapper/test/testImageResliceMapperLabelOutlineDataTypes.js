import { it, expect } from 'vitest';
import testUtils from 'vtk.js/Sources/Testing/testUtils';
import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';

import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkImageResliceMapper from 'vtk.js/Sources/Rendering/Core/ImageResliceMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';

import baseline from './testImageResliceMapperLabelOutlineDataTypes.png';

// Three segments side by side; segment 2's outline is hidden by a thickness of
// 0. The labelmap must draw the same whatever type stores its labels.
// This mapper's outline thickness counts voxels, hence 2 rather than 6.
const SEGMENTS = [
  { label: 1, xRange: [2, 12] },
  { label: 2, xRange: [15, 25] },
  { label: 3, xRange: [28, 38] },
];

function createLabelmap(ArrayType) {
  const dims = [40, 30, 3];
  const values = new ArrayType(dims[0] * dims[1] * dims[2]);
  for (let k = 0; k < dims[2]; k++) {
    for (let j = 3; j < 27; j++) {
      for (let i = 0; i < dims[0]; i++) {
        const segment = SEGMENTS.find(
          ({ xRange }) => i >= xRange[0] && i < xRange[1]
        );
        if (segment) {
          values[i + dims[0] * (j + dims[1] * k)] = segment.label;
        }
      }
    }
  }
  const imageData = vtkImageData.newInstance();
  imageData.setDimensions(dims);
  imageData
    .getPointData()
    .setScalars(vtkDataArray.newInstance({ numberOfComponents: 1, values }));
  return imageData;
}

it.skipIf(__VTK_TEST_NO_WEBGL__).each([
  ['8-bit', Uint8Array],
  ['16-bit', Uint16Array],
  ['signed 16-bit', Int16Array],
  ['float', Float32Array],
])(
  'Test ImageResliceMapper label outline with a %s labelmap',
  async (name, ArrayType) => {
    const gc = testUtils.createGarbageCollector();
    expect(
      'rendering',
      'vtkImageResliceMapper LabelOutlineDataTypes'
    ).toBeTruthy();

    const container = document.querySelector('body');
    const renderWindowContainer = gc.registerDOMElement(
      document.createElement('div')
    );
    container.appendChild(renderWindowContainer);

    const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
    const renderer = gc.registerResource(vtkRenderer.newInstance());
    renderWindow.addRenderer(renderer);
    renderer.setBackground(0.3, 0.3, 0.3);

    const mapper = gc.registerResource(vtkImageResliceMapper.newInstance());
    const slicePlane = gc.registerResource(vtkPlane.newInstance());
    slicePlane.setNormal(0, 0, 1);
    slicePlane.setOrigin(0, 0, 1);
    mapper.setSlicePlane(slicePlane);
    mapper.setInputData(createLabelmap(ArrayType));

    const actor = gc.registerResource(vtkImageSlice.newInstance());
    actor.setMapper(mapper);

    const color = gc.registerResource(vtkColorTransferFunction.newInstance());
    color.addRGBPoint(0, 0, 0, 0);
    color.addRGBPoint(1, 1, 0, 0);
    color.addRGBPoint(2, 0, 1, 0);
    color.addRGBPoint(3, 0, 0, 1);
    const opacity = gc.registerResource(vtkPiecewiseFunction.newInstance());
    opacity.addPoint(0, 0);
    opacity.addPoint(1, 0.3);
    opacity.addPoint(3, 0.3);

    const property = actor.getProperty();
    property.setRGBTransferFunction(color);
    property.setPiecewiseFunction(opacity);
    property.setUseLookupTableScalarRange(true);
    property.setInterpolationTypeToNearest();
    property.setUseLabelOutline(true);
    property.setLabelOutlineThickness([2, 0, 2]);
    property.setLabelOutlineOpacity(1.0);

    renderer.addActor(actor);
    renderer.getActiveCamera().setParallelProjection(true);
    renderer.resetCamera();

    const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
    glwindow.setContainer(renderWindowContainer);
    renderWindow.addView(glwindow);
    glwindow.setSize(400, 400);

    const promise = glwindow
      .captureNextImage()
      .then((image) =>
        testUtils.compareImages(
          image,
          [baseline],
          `Rendering/Core/ImageResliceMapper/testImageResliceMapperLabelOutlineDataTypes (${name})`,
          1
        )
      );
    renderWindow.render();
    return promise;
  }
);
