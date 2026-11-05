import { it, expect, vi } from 'vitest';
import testUtils from 'vtk.js/Sources/Testing/testUtils';
import { createTrackedRenderView } from 'vtk.js/Sources/Testing/renderTestUtils';

import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkImageResliceMapper from 'vtk.js/Sources/Rendering/Core/ImageResliceMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import supportsNorm16Linear from 'vtk.js/Sources/Rendering/OpenGL/Texture/supportsNorm16Linear';

const skip = __VTK_TEST_NO_WEBGL__ || supportsNorm16Linear();

function createImageData() {
  const sideLen = 8;
  const imageData = vtkImageData.newInstance();
  imageData.setExtent(0, sideLen - 1, 0, sideLen - 1, 0, sideLen - 1);
  const scalars = vtkDataArray.newInstance({
    numberOfComponents: 1,
    values: Int16Array.from(
      { length: sideLen ** 3 },
      (_, i) => -1024 + (i % 4096)
    ),
  });
  imageData.getPointData().setScalars(scalars);
  return imageData;
}

function createVolume(gc, imageData) {
  const mapper = gc.registerResource(vtkVolumeMapper.newInstance());
  mapper.setInputData(imageData);
  const volume = gc.registerResource(vtkVolume.newInstance());
  volume.setMapper(mapper);
  const color = gc.registerResource(vtkColorTransferFunction.newInstance());
  color.addRGBPoint(-1024, 0, 0, 0);
  color.addRGBPoint(3071, 1, 1, 1);
  const opacity = gc.registerResource(vtkPiecewiseFunction.newInstance());
  opacity.addPoint(-1024, 0);
  opacity.addPoint(3071, 1);
  volume.getProperty().setRGBTransferFunction(0, color);
  volume.getProperty().setScalarOpacity(0, opacity);
  return volume;
}

function createSlice(gc, imageData) {
  const mapper = gc.registerResource(vtkImageResliceMapper.newInstance());
  mapper.setInputData(imageData);
  mapper.setSlicePlane(
    vtkPlane.newInstance({ origin: [4, 4, 4], normal: [0, 0, 1] })
  );
  const slice = gc.registerResource(vtkImageSlice.newInstance());
  slice.setMapper(mapper);
  return slice;
}

// Expose EXT_texture_norm16 even where the browser does not
function advertiseNorm16(gl) {
  const getExtension = gl.getExtension.bind(gl);
  const fakeNorm16Ext = {
    R16_EXT: 0x822a,
    RG16_EXT: 0x822c,
    RGB16_EXT: 0x8054,
    RGBA16_EXT: 0x805b,
    R16_SNORM_EXT: 0x8f98,
    RG16_SNORM_EXT: 0x8f99,
    RGB16_SNORM_EXT: 0x8f9a,
    RGBA16_SNORM_EXT: 0x8f9b,
  };
  vi.spyOn(gl, 'getExtension').mockImplementation((name) =>
    name === 'EXT_texture_norm16'
      ? (getExtension(name) ?? fakeNorm16Ext)
      : getExtension(name)
  );
}

function getScalarTextureDataType(view, imageData) {
  const scalars = imageData.getPointData().getScalars();
  return view
    .getGraphicsResourceForObject(scalars)
    .oglObject.getOpenGLDataType();
}

it.skipIf(skip)(
  'does not use norm16 for volume textures that cannot be linearly filtered',
  () => {
    const gc = testUtils.createGarbageCollector();
    const { renderer, renderWindow, view } = createTrackedRenderView(gc);
    const gl = view.getContext();
    advertiseNorm16(gl);

    const imageData = createImageData();
    const volume = createVolume(gc, imageData);
    // Built and cached while filtering is nearest
    volume.getProperty().setInterpolationTypeToNearest();
    renderer.addVolume(volume);
    renderer.resetCamera();
    renderWindow.render();
    expect(getScalarTextureDataType(view, imageData)).not.toBe(gl.SHORT);

    volume.getProperty().setInterpolationTypeToLinear();
    renderWindow.render();
    expect(getScalarTextureDataType(view, imageData)).not.toBe(gl.SHORT);

    vi.restoreAllMocks();
    gc.releaseResources();
  }
);

it.skipIf(skip)(
  'does not use norm16 for reslice textures that cannot be linearly filtered',
  () => {
    const gc = testUtils.createGarbageCollector();
    const { renderer, renderWindow, view } = createTrackedRenderView(gc);
    const gl = view.getContext();
    advertiseNorm16(gl);

    const imageData = createImageData();
    const slice = createSlice(gc, imageData);
    slice.getProperty().setInterpolationTypeToLinear();
    renderer.addActor(slice);
    renderer.resetCamera();
    renderWindow.render();
    expect(getScalarTextureDataType(view, imageData)).not.toBe(gl.SHORT);

    vi.restoreAllMocks();
    gc.releaseResources();
  }
);
