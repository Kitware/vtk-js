import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/All';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';
import vtkImageResliceMapper from '@kitware/vtk.js/Rendering/Core/ImageResliceMapper';
import vtkImageSlice from '@kitware/vtk.js/Rendering/Core/ImageSlice';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';
import vtkPlane from '@kitware/vtk.js/Common/DataModel/Plane';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';
import vtkImageData from '@kitware/vtk.js/Common/DataModel/ImageData';
import { SlabTypes } from '@kitware/vtk.js/Rendering/Core/ImageResliceMapper/Constants';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import GUI from 'lil-gui';

/**
 * This example demonstrates slab-projected label outlines with the image
 * reslice mapper.
 *
 * It is the reslice-mapper counterpart of the LabelmapEdgeProjection example
 * (which uses the volume mapper's LABELMAP_EDGE_PROJECTION_BLEND). The base
 * image renders as a thick-slab MIP through vtkImageResliceMapper, and the
 * labelmap renders as a second reslice actor over the same slab with
 * useLabelOutline enabled.
 *
 * With a slab active, the mapper projects label presence across the whole
 * slab and draws each label's outline where its projected footprint ends, so
 * segment edges remain visible over the MIP instead of the labelmap either
 * disappearing (single-slice labels) or filling the whole projected footprint.
 */
const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Base image pipeline (thick-slab MIP through the reslice mapper)
// ----------------------------------------------------------------------------

const slicePlane = vtkPlane.newInstance();
slicePlane.setNormal(0, 0, 1);

const imageActor = vtkImageSlice.newInstance();
const imageMapper = vtkImageResliceMapper.newInstance();
imageMapper.setSlicePlane(slicePlane);
imageMapper.setSlabType(SlabTypes.MAX);
imageActor.setMapper(imageMapper);

const labelmapActor = vtkImageSlice.newInstance();
const labelmapMapper = vtkImageResliceMapper.newInstance();
labelmapMapper.setSlicePlane(slicePlane);
labelmapMapper.setSlabType(SlabTypes.MAX);
labelmapActor.setMapper(labelmapMapper);

// ----------------------------------------------------------------------------
// GUI controls
// ----------------------------------------------------------------------------
const gui = new GUI();
const guiParams = {
  slabThickness: 1,
  thickness1: 3,
  thickness2: 3,
  outlineOpacity: 1,
};

let maxSlabThickness = 100;
let slabThicknessController = null;

// ----------------------------------------------------------------------------
// Common functions
// ----------------------------------------------------------------------------

function createSphericalLabel(data, d, c, radius, label) {
  for (let k = 0; k < d[2]; k++) {
    for (let j = 0; j < d[1]; j++) {
      for (let i = 0; i < d[0]; i++) {
        const dx = i - c[0];
        const dy = j - c[1];
        const dz = k - c[2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distance <= radius) {
          const index = k * d[1] * d[0] + j * d[0] + i;
          data[index] = label;
        }
      }
    }
  }
}

function setupImageTransferFunctions() {
  const ctfun = vtkColorTransferFunction.newInstance();
  ctfun.addRGBPoint(0, 0, 0, 0);
  ctfun.addRGBPoint(255, 1.0, 1.0, 1.0);

  const ofun = vtkPiecewiseFunction.newInstance();
  ofun.addPoint(0.0, 1.0);
  ofun.addPoint(255.0, 1.0);

  imageActor.getProperty().setRGBTransferFunction(0, ctfun);
  imageActor.getProperty().setPiecewiseFunction(0, ofun);
  imageActor.getProperty().setUseLookupTableScalarRange(true);
}

function createLabelmap(imgData, d, c, r1, r2) {
  const values = new Uint8Array(imgData.getNumberOfPoints());
  const labelMapData = vtkImageData.newInstance(
    imgData.get('spacing', 'origin', 'direction')
  );

  const dataArray = vtkDataArray.newInstance({
    numberOfComponents: 1, // labelmap with single component
    values,
  });
  labelMapData.getPointData().setScalars(dataArray);

  labelMapData.setDimensions(...imgData.getDimensions());
  labelMapData.setSpacing(...imgData.getSpacing());
  labelMapData.setOrigin(...imgData.getOrigin());
  labelMapData.setDirection(...imgData.getDirection());

  const labelmapArray = labelMapData.getPointData().getScalars().getData();

  // Same labels as the LabelmapEdgeProjection example
  createSphericalLabel(labelmapArray, d, c, r1, 1);
  createSphericalLabel(
    labelmapArray,
    d,
    [c[0] + 2 * r1, c[1] + 2 * r1, c[2] + 2 * r1],
    r2,
    2
  );

  return labelMapData;
}

function setupLabelmapTransferFunctions() {
  const labelMapColorFunction = vtkColorTransferFunction.newInstance();
  labelMapColorFunction.addRGBPoint(0, 0, 0, 0);
  labelMapColorFunction.addRGBPoint(1, 0, 0, 1); // Blue for label 1
  labelMapColorFunction.addRGBPoint(2, 1, 0, 0); // Red for label 2

  // Edge projection only: the label fill stays fully transparent
  const labelMapOpacityFunction = vtkPiecewiseFunction.newInstance();
  labelMapOpacityFunction.addPoint(0, 0);
  labelMapOpacityFunction.addPoint(1, 0);
  labelMapOpacityFunction.addPoint(2, 0);

  const property = labelmapActor.getProperty();
  property.setRGBTransferFunction(0, labelMapColorFunction);
  property.setPiecewiseFunction(0, labelMapOpacityFunction);
  property.setUseLookupTableScalarRange(true);

  // set interpolation to nearest to avoid blending labels
  property.setInterpolationTypeToNearest();

  property.setUseLabelOutline(true);
  property.setLabelOutlineOpacity(guiParams.outlineOpacity);
  property.setLabelOutlineThickness([
    guiParams.thickness1,
    guiParams.thickness2,
  ]);
}

function updateOutlineThickness() {
  labelmapActor
    .getProperty()
    .setLabelOutlineThickness([guiParams.thickness1, guiParams.thickness2]);
  renderWindow.render();
}

function updateOutlineOpacity() {
  labelmapActor.getProperty().setLabelOutlineOpacity(guiParams.outlineOpacity);
  renderWindow.render();
}

function updateSlabThickness() {
  imageMapper.setSlabThickness(guiParams.slabThickness);
  labelmapMapper.setSlabThickness(guiParams.slabThickness);
  renderWindow.render();
}

gui
  .add(guiParams, 'thickness1', 1, 10, 1)
  .name('Segment 1 Thickness')
  .onChange(updateOutlineThickness);
gui
  .add(guiParams, 'thickness2', 1, 10, 1)
  .name('Segment 2 Thickness')
  .onChange(updateOutlineThickness);
gui
  .add(guiParams, 'outlineOpacity', 0, 1, 0.05)
  .name('Outline Opacity')
  .onChange(updateOutlineOpacity);

// ----------------------------------------------------------------------------
// Main execution
// ----------------------------------------------------------------------------

const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });

reader.setUrl(`${__BASE_PATH__}/data/volume/LIDC2.vti`).then(() => {
  reader.loadData().then(() => {
    const imageData = reader.getOutputData();

    const dims = imageData.getDimensions();
    const center = dims.map((d) => Math.floor(d / 2));
    const minDim = Math.min(...dims);
    const radius1 = Math.floor(minDim / 6);
    const radius2 = Math.floor(minDim / 6);

    const labelMapData = createLabelmap(
      imageData,
      dims,
      center,
      radius1,
      radius2
    );

    imageMapper.setInputData(imageData);
    labelmapMapper.setInputData(labelMapData);

    setupImageTransferFunctions();
    setupLabelmapTransferFunctions();

    const worldCenter = imageData.getCenter();
    slicePlane.setOrigin(worldCenter);

    // Default the slab to the full volume extent along the slice normal so
    // the base image renders as a full MIP like the volume-mapper example
    const bounds = imageData.getBounds();
    maxSlabThickness = Math.ceil(bounds[5] - bounds[4]);
    guiParams.slabThickness = maxSlabThickness;
    slabThicknessController = gui
      .add(guiParams, 'slabThickness', 0, maxSlabThickness, 1)
      .name('Slab Thickness')
      .onChange(updateSlabThickness);
    slabThicknessController.updateDisplay();
    updateSlabThickness();

    renderer.addActor(imageActor);
    renderer.addActor(labelmapActor);

    // Keep the reslice plane facing the camera so rotating with the default
    // trackball style spins the slab MIP like the volume-mapper example
    const camera = renderer.getActiveCamera();
    camera.onModified(() => {
      slicePlane.setNormal(camera.getDirectionOfProjection());
      slicePlane.setOrigin(worldCenter);
    });

    renderer.resetCamera();
    renderer.resetCameraClippingRange();
    renderWindow.render();
  });
});

// ----------------------------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// ----------------------------------------------------------------------------

global.source = reader;
global.imageMapper = imageMapper;
global.imageActor = imageActor;
global.labelmapMapper = labelmapMapper;
global.labelmapActor = labelmapActor;
global.renderer = renderer;
global.renderWindow = renderWindow;
