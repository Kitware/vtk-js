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
const controlPanel = `
<table>
  <tr>
    <td>
      <label for="modeselect">Blend Mode:</label>
      <select id="modeselect">
        <option value="regular">Regular MIP</option>
        <option value="edge">Labelmap Edge MIP</option>
      </select>
    </td>
  </tr>
  <tr>
    <td>
      <label for="thickness1">Segment 1 Thickness:</label>
      <input type="number" id="thickness1" value="3" min="1" max="10" step="1">
    </td>
  </tr>
  <tr>
    <td>
      <label for="thickness2">Segment 2 Thickness:</label>
      <input type="number" id="thickness2" value="3" min="1" max="10" step="1">
    </td>
  </tr>

</table>
`;

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
// Common functions
// ----------------------------------------------------------------------------

function createSphericalLabel(
  data,
  dims,
  center,
  radius,
  label,
  numberOfComponents
) {
  for (let k = 0; k < dims[2]; k++) {
    for (let j = 0; j < dims[1]; j++) {
      for (let i = 0; i < dims[0]; i++) {
        const dx = i - center[0];
        const dy = j - center[1];
        const dz = k - center[2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distance <= radius) {
          const index =
            (k * dims[1] * dims[0] + j * dims[0] + i) * numberOfComponents + 1;
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

function createRegularLabelmap(imageData, dims, center, radius1, radius2) {
  const values = new Uint8Array(imageData.getNumberOfPoints());
  const labelMapData = vtkImageData.newInstance(
    imageData.get('spacing', 'origin', 'direction')
  );

  const dataArray = vtkDataArray.newInstance({
    numberOfComponents: 1, // labelmap with single component
    values,
  });
  labelMapData.getPointData().setScalars(dataArray);

  labelMapData.setDimensions(...imageData.getDimensions());
  labelMapData.setSpacing(...imageData.getSpacing());
  labelMapData.setOrigin(...imageData.getOrigin());
  labelMapData.setDirection(...imageData.getDirection());

  const labelmapArray = labelMapData.getPointData().getScalars().getData();
  const numberOfComponents = 1;

  createSphericalLabel(
    labelmapArray,
    dims,
    center,
    radius1,
    1,
    numberOfComponents
  );
  createSphericalLabel(
    labelmapArray,
    dims,
    [center[0] + 2 * radius1, center[1] + 2 * radius1, center[2] + 2 * radius1],
    radius2,
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

function createAdvancedMIPLabelmap(imageData, dims, center, radius1, radius2) {
  const array = imageData.getPointData().getArray(0);
  const baseData = array.getData();

  const numberOfComponents = 2;
  const cubeData = new Float32Array(numberOfComponents * baseData.length);

  // Copy original data to first component
  for (let i = 0; i < baseData.length; i++) {
    cubeData[i * numberOfComponents] = baseData[i];
  }

  createSphericalLabel(cubeData, dims, center, radius1, 1, numberOfComponents);
  createSphericalLabel(
    cubeData,
    dims,
    [center[0] + 2 * radius1, center[1] + 2 * radius1, center[2] + 2 * radius1],
    radius2,
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

// ----------------------------------------------------------------------------
// Main execution
// ----------------------------------------------------------------------------

const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });

function updateOutlineThickness() {
  const thickness1 = parseInt(document.querySelector('#thickness1').value, 10);
  const thickness2 = parseInt(document.querySelector('#thickness2').value, 10);
  actor.getProperty().setLabelOutlineThickness([thickness1, thickness2]);
  renderWindow.render();
}

reader.setUrl(`${__BASE_PATH__}/data/volume/LIDC2.vti`).then(() => {
  reader.loadData().then(() => {
    const imageData = reader.getOutputData();

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

    createBasePipeline();

    const dims = imageData.getDimensions();
    const center = dims.map((d) => Math.floor(d / 2));
    const minDim = Math.min(...dims);
    const radius1 = Math.floor(minDim / 6);
    const radius2 = Math.floor(minDim / 6);

    let edgeLabelmapActor = null;
    let regularLabelmapActor = null;

    function updateBlendMode(mode) {
      if (mode === 'edge') {
        // remove the regular labelmap if it exists
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
        // set the labelmap to be additive
        regularLabelmapActor
          .getMapper()
          .setBlendMode(BlendMode.COMPOSITE_BLEND);
      }
      renderer.resetCamera();
      renderWindow.render();
    }

    actor.getProperty().setInterpolationTypeToLinear();
    actor.getProperty().setForceNearestInterpolation(1, true);

    renderer.resetCamera();
    renderWindow.render();

    updateBlendMode('regular');

    fullScreenRenderer.addController(controlPanel);

    const modeSelect = document.querySelector('#modeselect');
    modeSelect.addEventListener('change', (event) => {
      updateBlendMode(event.target.value);
    });

    const thickness1Input = document.querySelector('#thickness1');
    const thickness2Input = document.querySelector('#thickness2');

    thickness1Input.addEventListener('change', updateOutlineThickness);
    thickness2Input.addEventListener('change', updateOutlineThickness);

    // Initial thickness setup
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
