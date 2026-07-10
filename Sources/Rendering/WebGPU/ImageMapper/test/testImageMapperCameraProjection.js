import { it, expect } from 'vitest';

import testUtils from 'vtk.js/Sources/Testing/testUtils';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';

// Fraction of pixels in a captured data URL brighter than the given cutoff.
async function computeBrightFraction(dataURL, cutoff = 100) {
  const image = new Image();
  image.src = dataURL;
  await image.decode();

  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0);

  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  let bright = 0;
  const pixelCount = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    if ((data[i] + data[i + 1] + data[i + 2]) / 3 > cutoff) {
      bright++;
    }
  }
  return bright / pixelCount;
}

it.skipIf(!__VTK_TEST_WEBGPU__)(
  'Test WebGPU ImageMapper applies the view-projection matrix exactly once',
  async () => {
    const gc = testUtils.createGarbageCollector();

    const container = document.querySelector('body');
    const renderWindowContainer = gc.registerDOMElement(
      document.createElement('div')
    );
    container.appendChild(renderWindowContainer);

    const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
    const renderer = gc.registerResource(vtkRenderer.newInstance());
    renderWindow.addRenderer(renderer);
    renderer.setBackground(0, 0, 0);

    // A constant bright slice positioned away from the world origin, the way
    // medical viewers place slices in patient space.
    const dims = 64;
    const sliceZ = 50;
    const values = new Uint8Array(dims * dims).fill(255);
    const scalars = vtkDataArray.newInstance({
      name: 'Scalars',
      values,
      numberOfComponents: 1,
    });
    const imageData = gc.registerResource(vtkImageData.newInstance());
    imageData.setDimensions(dims, dims, 1);
    imageData.setOrigin(0, 0, sliceZ);
    imageData.getPointData().setScalars(scalars);

    const mapper = gc.registerResource(vtkImageMapper.newInstance());
    mapper.setInputData(imageData);

    const actor = gc.registerResource(vtkImageSlice.newInstance());
    actor.getProperty().setColorWindow(255);
    actor.getProperty().setColorLevel(127);
    actor.setMapper(mapper);
    renderer.addActor(actor);

    // Parallel camera one unit in front of the slice, looking down +z. If
    // the vertex shader applies the SCPC (view-projection) matrix more than
    // once, the doubly-projected quad falls outside the clip volume and the
    // slice silently disappears; applied once, it fills the viewport.
    const center = (dims - 1) / 2;
    const camera = renderer.getActiveCamera();
    camera.setParallelProjection(true);
    camera.setFocalPoint(center, center, sliceZ);
    camera.setPosition(center, center, sliceZ - 1);
    camera.setViewUp(0, -1, 0);
    camera.setParallelScale(dims / 2);
    camera.setClippingRange(0.01, 1000.01);

    const view = gc.registerResource(renderWindow.newAPISpecificView('WebGPU'));
    view.setContainer(renderWindowContainer);
    renderWindow.addView(view);
    view.setSize(128, 128);

    const promise = view
      .captureNextImage()
      .then(async (image) => {
        const brightFraction = await computeBrightFraction(image);
        expect(
          brightFraction,
          'the slice must cover the viewport (a doubly-projected quad is clipped away and renders nothing)'
        ).toBeGreaterThan(0.5);
      })
      .finally(gc.releaseResources);
    renderWindow.render();
    return promise;
  }
);
