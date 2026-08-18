import { it, expect } from 'vitest';
import { mat4 } from 'gl-matrix';
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

const DIMENSIONS = [16, 16, 16];

// A large off center block of voxels: it covers many pixels of the image, and
// a wrong scaling of the texture coordinates moves it instead of only
// resizing it
const MARKER_RANGE = [8, 16];

// The scaling is anisotropic, to catch transforms that are not rigid
const SCALING = [2, 1, 3];

function createImageData(spacing) {
  const imageData = vtkImageData.newInstance();
  imageData.setDimensions(...DIMENSIONS);
  imageData.setSpacing(...spacing);
  imageData.setOrigin(0, 0, 0);

  const values = new Float32Array(
    DIMENSIONS[0] * DIMENSIONS[1] * DIMENSIONS[2]
  );
  for (let z = MARKER_RANGE[0]; z < MARKER_RANGE[1]; ++z) {
    for (let y = MARKER_RANGE[0]; y < MARKER_RANGE[1]; ++y) {
      for (let x = MARKER_RANGE[0]; x < MARKER_RANGE[1]; ++x) {
        values[x + DIMENSIONS[0] * (y + DIMENSIONS[1] * z)] = 200;
      }
    }
  }
  imageData.getPointData().setScalars(
    vtkDataArray.newInstance({
      name: 'scalars',
      values,
      numberOfComponents: 1,
    })
  );
  return imageData;
}

function createVolume(gc, spacing, userMatrix) {
  const mapper = gc.registerResource(vtkVolumeMapper.newInstance());
  mapper.setInputData(createImageData(spacing));
  mapper.setSampleDistance(0.4);

  const actor = gc.registerResource(vtkVolume.newInstance());
  actor.setMapper(mapper);
  if (userMatrix) {
    actor.setUserMatrix(userMatrix);
  }

  const colorTransferFunction = vtkColorTransferFunction.newInstance();
  colorTransferFunction.addRGBPoint(0, 0, 0, 0);
  colorTransferFunction.addRGBPoint(200, 1, 1, 1);

  const opacityFunction = vtkPiecewiseFunction.newInstance();
  opacityFunction.addPoint(0, 0);
  opacityFunction.addPoint(199, 0);
  opacityFunction.addPoint(200, 0.6);

  const property = actor.getProperty();
  property.setRGBTransferFunction(0, colorTransferFunction);
  property.setScalarOpacity(0, opacityFunction);
  property.setInterpolationTypeToLinear();
  // The gradient magnitude is in index coordinates, so shading would not give
  // the same image for the two spacings of this test
  property.setShade(false);

  return actor;
}

it.skipIf(__VTK_TEST_NO_WEBGL__)('Test Volume Mapper User Matrix', async () => {
  const gc = testUtils.createGarbageCollector();
  expect('rendering', 'vtkOpenGLVolumeMapper UserMatrix').toBeTruthy();

  const container = document.querySelector('body');
  const renderWindowContainer = gc.registerDOMElement(
    document.createElement('div')
  );
  container.appendChild(renderWindowContainer);

  const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
  const renderer = gc.registerResource(vtkRenderer.newInstance());
  renderer.setBackground(0, 0, 0);
  renderWindow.addRenderer(renderer);

  const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  const interactor = vtkRenderWindowInteractor.newInstance();
  interactor.setStillUpdateRate(0.01);
  interactor.setView(glwindow);
  interactor.initialize();
  interactor.bindEvents(renderWindowContainer);

  // This volume is scaled by the spacing of its image data
  const spacingVolume = createVolume(gc, SCALING, null);
  // This volume is scaled by the matrix of its actor, so it must give the
  // same image as the volume above
  const userMatrixVolume = createVolume(
    gc,
    [1, 1, 1],
    mat4.fromScaling(mat4.create(), SCALING)
  );

  // The two volumes have the same bounds, and the camera is set only once,
  // so the two images differ only if a transform is wrong
  renderer.addVolume(spacingVolume);
  renderer.resetCamera();
  const camera = renderer.getActiveCamera();
  camera.elevation(30);
  camera.azimuth(30);
  camera.orthogonalizeViewUp();
  renderer.resetCameraClippingRange();

  const spacingImagePromise = glwindow.captureNextImage();
  renderWindow.render();
  const spacingImage = await spacingImagePromise;

  renderer.removeVolume(spacingVolume);
  renderer.addVolume(userMatrixVolume);

  const userMatrixImagePromise = glwindow.captureNextImage();
  renderWindow.render();
  const userMatrixImage = await userMatrixImagePromise;

  return testUtils
    .compareImages(
      userMatrixImage,
      [spacingImage],
      'Rendering/OpenGL/VolumeMapper/testUserMatrix',
      0.5
    )
    .finally(gc.releaseResources);
});
