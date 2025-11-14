import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Volume';
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import { ColorMixPreset } from '@kitware/vtk.js/Rendering/Core/VolumeProperty/Constants';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';
import vtkVolume from '@kitware/vtk.js/Rendering/Core/Volume';
import vtkVolumeMapper from '@kitware/vtk.js/Rendering/Core/VolumeMapper';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';
import Constants from 'vtk.js/Sources/Rendering/Core/VolumeMapper/Constants';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';
import vtkImageData from '@kitware/vtk.js/Common/DataModel/ImageData';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import GUI from 'lil-gui';

const { BlendMode } = Constants;

/**
 * This example demonstrates how to use the MIP blend mode with labelmaps.
 *
 *
 * Regular blend modes are unsuitable for labelmaps because they blend
 * the labelmap with the background. If two segments are positioned
 * one behind or in front of the other, the rendering of the MIP (which is
 * by design depth-sensitive) will not display the labelmaps correctly.
 *
 * Regular Blend Modes: [ADDITIVE_INTENSITY_BLEND, COMPOSITE_BLEND]
 *
 * However, the new blend mode LABELMAP_EDGE_PROJECTION_BLEND renders the labelmap
 * segment edges so that they are visible in the MIP rendering. This is
 * particularly useful for medical imaging applications.
 *
 * New Blend Mode: [LABELMAP_EDGE_PROJECTION_BLEND]
 *
 */
const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

const actor = vtkVolume.newInstance();
const mapper = vtkVolumeMapper.newInstance();
mapper.setBlendModeToMaximumIntensity();
actor.setMapper(mapper);

// ----------------------------------------------------------------------------
// GUI controls (replace controlPanel)
// ----------------------------------------------------------------------------
const gui = new GUI();
const guiParams = {
  blendMode: 'regular',
  thickness1: 3,
  thickness2: 3,
};

let imageData;
let dims;
let center;
let radius1;
let radius2;
let edgeLabelmapActor = null;
let regularLabelmapActor = null;

// ----------------------------------------------------------------------------
// Common functions
// ----------------------------------------------------------------------------

function createSphericalLabel(data, d, c, radius, label, numberOfComponents) {
  for (let k = 0; k < d[2]; k++) {
    for (let j = 0; j < d[1]; j++) {
      for (let i = 0; i < d[0]; i++) {
        const dx = i - c[0];
        const dy = j - c[1];
        const dz = k - c[2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distance <= radius) {
          const index =
            (k * d[1] * d[0] + j * d[0] + i) * numberOfComponents + 1;
          data[index] = label;
        }
      }
    }
  }
}

function setupTransferFunctions() {
  const ctfun = vtkColorTransferFunction.newInstance();
  ctfun.addRGBPoint(0, 0, 0, 0);
  ctfun.addRGBPoint(255, 1.0, 1.0, 1.0);

  const ofun = vtkPiecewiseFunction.newInstance();
  ofun.addPoint(0.0, 0.1);
  ofun.addPoint(255.0, 1.0);

  actor.getProperty().setRGBTransferFunction(0, ctfun);
  actor.getProperty().setScalarOpacity(0, ofun);
}

// ----------------------------------------------------------------------------
// Labelmap creation functions
// ----------------------------------------------------------------------------

function createRegularLabelmap(imgData, d, c, r1, r2) {
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
  const numberOfComponents = 1;

  createSphericalLabel(labelmapArray, d, c, r1, 1, numberOfComponents);
  createSphericalLabel(
    labelmapArray,
    d,
    [c[0] + 2 * r1, c[1] + 2 * r1, c[2] + 2 * r1],
    r2,
    2,
    numberOfComponents
  );

  const labelmapActor = vtkVolume.newInstance();
  const labelmapMapper = vtkVolumeMapper.newInstance();

  // Labelmap pipeline
  labelmapMapper.setInputData(labelMapData);
  labelmapActor.setMapper(labelmapMapper);

  const labelMapColorFunction = vtkColorTransferFunction.newInstance();
  labelMapColorFunction.addRGBPoint(0, 0, 0, 0);
  labelMapColorFunction.addRGBPoint(1, 0, 0, 1); // Blue for label 1
  labelMapColorFunction.addRGBPoint(2, 1, 0, 0); // Red for label 2

  const labelMapOpacityFunction = vtkPiecewiseFunction.newInstance();
  labelMapOpacityFunction.addPoint(0, 0);
  labelMapOpacityFunction.addPoint(1, 0.5);
  labelMapOpacityFunction.addPoint(2, 0.5);

  labelmapActor.getProperty().setRGBTransferFunction(0, labelMapColorFunction);
  labelmapActor.getProperty().setScalarOpacity(0, labelMapOpacityFunction);

  // set interpolation to nearest to avoid blending
  labelmapActor.getProperty().setInterpolationTypeToNearest();
  renderer.addVolume(labelmapActor);

  return labelmapActor;
}

function createAdvancedMIPLabelmap(imgData, d, c, r1, r2) {
  const array = imgData.getPointData().getArray(0);
  const baseData = array.getData();

  const numberOfComponents = 2;
  const cubeData = new Float32Array(numberOfComponents * baseData.length);

  // Copy original data to first component
  for (let i = 0; i < baseData.length; i++) {
    cubeData[i * numberOfComponents] = baseData[i];
  }

  createSphericalLabel(cubeData, d, c, r1, 1, numberOfComponents);
  createSphericalLabel(
    cubeData,
    d,
    [c[0] + 2 * r1, c[1] + 2 * r1, c[2] + 2 * r1],
    r2,
    2,
    numberOfComponents
  );

  actor.getProperty().setColorMixPreset(ColorMixPreset.ADDITIVE);

  const maskCtfun = vtkColorTransferFunction.newInstance();
  maskCtfun.addRGBPoint(0, 0, 0, 0);
  maskCtfun.addRGBPoint(1, 0, 0, 1); // blue  to red
  maskCtfun.addRGBPoint(2, 1, 0, 0); // red to green

  const maskOfun = vtkPiecewiseFunction.newInstance();
  maskOfun.addPoint(0, 0);
  maskOfun.addPoint(1, 1);
  maskOfun.addPoint(2, 1);

  const arrayAgain = mapper.getInputData().getPointData().getArray(0);
  arrayAgain.setData(cubeData);
  arrayAgain.setNumberOfComponents(2);

  actor.getProperty().setRGBTransferFunction(1, maskCtfun);
  actor.getProperty().setScalarOpacity(1, maskOfun);
  actor.getProperty().setForceNearestInterpolation(1, true);

  // same thickness
  actor.getProperty().setLabelOutlineThickness(3);
  // per label thickness
  //   actor.getProperty().setLabelOutlineThickness([5, 1]);

  return actor;
}

function createBasePipeline() {
  renderer.removeVolume(actor);
  mapper.setInputData(imageData);

  renderer.addVolume(actor);
  setupTransferFunctions();

  actor.getProperty().setInterpolationTypeToLinear();
  actor.getProperty().setForceNearestInterpolation(1, true);

  renderer.resetCamera();
  renderWindow.render();
}

function updateOutlineThickness() {
  actor
    .getProperty()
    .setLabelOutlineThickness([guiParams.thickness1, guiParams.thickness2]);
  renderWindow.render();
}

function updateBlendMode(mode) {
  if (!imageData || !dims || !center || !radius1 || !radius2) return;
  if (mode === 'edge') {
    if (regularLabelmapActor) {
      renderer.removeVolume(regularLabelmapActor);
      regularLabelmapActor = null;
    }
    edgeLabelmapActor = createAdvancedMIPLabelmap(
      imageData,
      dims,
      center,
      radius1,
      radius2
    );
    mapper.setBlendMode(BlendMode.LABELMAP_EDGE_PROJECTION_BLEND);
  } else {
    if (edgeLabelmapActor) {
      renderer.removeVolume(edgeLabelmapActor);
      edgeLabelmapActor = null;
      createBasePipeline();
    }
    regularLabelmapActor = createRegularLabelmap(
      imageData,
      dims,
      center,
      radius1,
      radius2
    );
    mapper.setBlendMode(BlendMode.MAXIMUM_INTENSITY_BLEND);
    regularLabelmapActor.getMapper().setBlendMode(BlendMode.COMPOSITE_BLEND);
  }
  renderer.resetCamera();
  renderWindow.render();
}

gui
  .add(guiParams, 'blendMode', {
    'Regular MIP': 'regular',
    'Labelmap Edge MIP': 'edge',
  })
  .name('Blend Mode')
  .onChange((mode) => {
    updateBlendMode(mode);
  });
gui
  .add(guiParams, 'thickness1', 1, 10, 1)
  .name('Segment 1 Thickness')
  .onChange(updateOutlineThickness);
gui
  .add(guiParams, 'thickness2', 1, 10, 1)
  .name('Segment 2 Thickness')
  .onChange(updateOutlineThickness);

// ----------------------------------------------------------------------------
// Main execution
// ----------------------------------------------------------------------------

const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });

reader.setUrl(`${__BASE_PATH__}/data/volume/LIDC2.vti`).then(() => {
  reader.loadData().then(() => {
    imageData = reader.getOutputData();

    dims = imageData.getDimensions();
    center = dims.map((d) => Math.floor(d / 2));
    const minDim = Math.min(...dims);
    radius1 = Math.floor(minDim / 6);
    radius2 = Math.floor(minDim / 6);

    edgeLabelmapActor = null;
    regularLabelmapActor = null;

    createBasePipeline();

    actor.getProperty().setInterpolationTypeToLinear();
    actor.getProperty().setForceNearestInterpolation(1, true);

    renderer.resetCamera();
    renderWindow.render();

    updateBlendMode(guiParams.blendMode);

    updateOutlineThickness();
  });
});

// ----------------------------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// ----------------------------------------------------------------------------

global.source = reader;
global.mapper = mapper;
global.actor = actor;
global.renderer = renderer;
global.renderWindow = renderWindow;
