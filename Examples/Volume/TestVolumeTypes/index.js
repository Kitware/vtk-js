import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Volume';

import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import Constants from 'vtk.js/Sources/Rendering/Core/ImageMapper/Constants';

import controlPanel from './controlPanel.html';

const { SlicingMode } = Constants;

// Create some control UI
const container = document.querySelector('body');
container.style.width = '450px';
container.style.height = '450px';
const renderWindowContainer = document.createElement('div');
container.appendChild(renderWindowContainer);

const style = {
  margin: '0',
  padding: '0',
  position: 'absolute',
  top: '0',
  left: '0',
  width: '100vw',
  height: '100vw',
  overflow: 'hidden',
};

// create what we will view
const fullScreenRenderWindow = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
  containerStyle: style,
});
const renderWindow = fullScreenRenderWindow.getRenderWindow();
const renderer = fullScreenRenderWindow.getRenderer();
fullScreenRenderWindow.addController(controlPanel);
renderer.setBackground(0.2, 0.2, 0.2);

const actor = vtkVolume.newInstance();

const mapper = vtkVolumeMapper.newInstance();
mapper.setSampleDistance(0.7);
actor.setMapper(mapper);

renderer.addVolume(actor);

// create color and opacity transfer functions
const ctfun = vtkColorTransferFunction.newInstance();
ctfun.addRGBPoint(0, 0.0, 0.5, 1.0);
ctfun.addRGBPoint(255.0, 1.0, 1.0, 0.0);
const ofun = vtkPiecewiseFunction.newInstance();
ofun.addPoint(0.0, 0.0);
ofun.addPoint(250.0, 0.2);
actor.getProperty().setRGBTransferFunction(0, ctfun);
actor.getProperty().setScalarOpacity(0, ofun);
actor.getProperty().setScalarOpacityUnitDistance(0, 3.0);
actor.getProperty().setComponentWeight(0, 1.0);
// actor.getProperty().setInterpolationTypeToLinear();

const ctfun2 = vtkColorTransferFunction.newInstance();
ctfun2.addRGBPoint(0, 1.0, 0, 0);
ctfun2.addRGBPoint(40, 0.0, 0.0, 1.0);
const ofun2 = vtkPiecewiseFunction.newInstance();
ofun2.addPoint(0.0, 0.0);
ofun2.addPoint(40.0, 0.1);
actor.getProperty().setRGBTransferFunction(1, ctfun2);
actor.getProperty().setScalarOpacity(1, ofun2);
actor.getProperty().setScalarOpacityUnitDistance(1, 0.5);
actor.getProperty().setComponentWeight(1, 1.0);

const ctfun3 = vtkColorTransferFunction.newInstance();
ctfun3.addRGBPoint(0, 0.0, 0, 0);
ctfun3.addRGBPoint(255, 1.0, 1.0, 1.0);
actor.getProperty().setRGBTransferFunction(2, ctfun3);
actor.getProperty().setScalarOpacity(2, ofun);
actor.getProperty().setScalarOpacityUnitDistance(2, 3.0);
actor.getProperty().setComponentWeight(2, 1.0);

const ctfun4 = vtkColorTransferFunction.newInstance();
ctfun4.addRGBPoint(0, 0.0, 0, 0);
ctfun4.addRGBPoint(255, 0.0, 1.0, 0.0);
actor.getProperty().setRGBTransferFunction(3, ctfun4);
actor.getProperty().setScalarOpacity(3, ofun);
actor.getProperty().setScalarOpacityUnitDistance(3, 3.0);
actor.getProperty().setComponentWeight(3, 1.0);

for (let nc = 0; nc < 4; ++nc) {
  actor.getProperty().setGradientOpacityMinimumValue(nc, 5.0);
  actor.getProperty().setGradientOpacityMaximumValue(nc, 10.0);
  actor.getProperty().setGradientOpacityMinimumOpacity(nc, 0.2);
  actor.getProperty().setGradientOpacityMaximumOpacity(nc, 1.0);
}

// Create the image slice representation
const sliceRenderer = vtkRenderer.newInstance();
sliceRenderer.setViewport([0.6, 0.6, 0.9, 0.9]);
renderWindow.addRenderer(sliceRenderer);
renderWindow.setNumberOfLayers(2);
// On top
sliceRenderer.setLayer(0);
sliceRenderer.setInteractive(false);
// sliceRenderer.setBackground(0.4, 0.4, 0.4);
const sliceMapper = vtkImageMapper.newInstance();
const sliceActor = vtkImageSlice.newInstance();
sliceActor.setMapper(sliceMapper);
sliceActor.getProperty().setRGBTransferFunction(0, ctfun);
sliceActor.getProperty().setPiecewiseFunction(0, ofun);
sliceActor.getProperty().setComponentWeight(0, 1.0);
sliceActor.getProperty().setRGBTransferFunction(1, ctfun2);
sliceActor.getProperty().setPiecewiseFunction(1, ofun2);
sliceActor.getProperty().setComponentWeight(1, 1.0);
sliceActor.getProperty().setRGBTransferFunction(2, ctfun3);
sliceActor.getProperty().setPiecewiseFunction(2, ofun);
sliceActor.getProperty().setComponentWeight(2, 1.0);
sliceActor.getProperty().setRGBTransferFunction(3, ctfun4);
sliceActor.getProperty().setPiecewiseFunction(3, ofun);
sliceActor.getProperty().setComponentWeight(3, 1.0);

// this function will over time test the following from outermost
// to innermost. Note that the three data types will be
// covered in one rotation of the volume making it easier to
// spot visual issues
//
// 0) lighting off/on
// 1) dependent versus independent components
// 2) 1 to 4 components
// 3) with and without Gradient opacity
// 4) Uint8 Int16 and Float32 data types
//
let lighting = 1;
let numComp = 1;
let independent = true;
let withGO = 1;
let dataType = 2;

const configureScene = (
  shade,
  numberOfComponents,
  independentComponents,
  useGradientOpacity,
  typeOfData
) => {
  actor.getProperty().setShade(shade);

  actor.getProperty().setIndependentComponents(independentComponents);
  sliceActor.getProperty().setIndependentComponents(independentComponents);

  actor.getProperty().setUseGradientOpacity(0, useGradientOpacity);
  actor.getProperty().setUseGradientOpacity(1, useGradientOpacity);
  actor.getProperty().setUseGradientOpacity(2, useGradientOpacity);
  actor.getProperty().setUseGradientOpacity(3, useGradientOpacity);

  // create a synthetic volume with multiple components
  const id = vtkImageData.newInstance();
  id.setExtent(0, 99, 0, 99, 0, 199);

  let newArray;

  if (typeOfData === 0) {
    newArray = new Uint8Array(200 * 100 * 100 * numberOfComponents);
  }
  if (typeOfData === 1) {
    newArray = new Int16Array(200 * 100 * 100 * numberOfComponents);
  }
  if (typeOfData === 2) {
    newArray = new Float32Array(200 * 100 * 100 * numberOfComponents);
  }

  for (let c = 0; c < numberOfComponents - 1; ++c) {
    actor.getProperty().setComponentWeight(c, 0.2);
  }
  actor.getProperty().setComponentWeight(numberOfComponents - 1, 1.0);

  let i = 0;
  for (let z = 0; z <= 199; z++) {
    for (let y = 0; y <= 99; y++) {
      for (let x = 0; x <= 99; x++) {
        newArray[i] =
          40.0 *
          (3.0 + Math.cos(x / 20.0) + Math.cos(y / 10.0) + Math.cos(z / 5.0));
        if (numberOfComponents >= 2) {
          newArray[i + 1] = independentComponents ? 0.2 * z : 1.25 * z;
        }
        if (numberOfComponents >= 3) {
          newArray[i + 2] = 125.0 * Math.cos(y / 10.0) + 128.0;
        }
        if (numberOfComponents >= 4) {
          newArray[i + 3] = 125.0 * Math.cos((x + z) / 15.0) + 128.0;
        }
        i += numberOfComponents;
      }
    }
  }

  const da = vtkDataArray.newInstance({
    numberOfComponents,
    values: newArray,
  });
  da.setName('scalars');

  const cpd = id.getPointData();
  cpd.setScalars(da);

  mapper.setInputData(id);
  // sliceMapper.setSliceAtFocalPoint(true);
  sliceMapper.setSlicingMode(SlicingMode.K);
  sliceMapper.setKSlice(100);
  sliceMapper.setInputData(id);
};

function redrawScene() {
  configureScene(lighting, numComp, independent, withGO, dataType);
  renderWindow.render();
}

function updateLighting(e) {
  const elt = e ? e.target : document.querySelector('.lighting');
  lighting = elt.checked ? 1 : 0;
  redrawScene();
}

function updateNumberOfComponents(e) {
  const elt = e ? e.target : document.querySelector('.numComp');
  numComp = Number(elt.value);
  redrawScene();
}

function updateIndependent(e) {
  const elt = e ? e.target : document.querySelector('.independent');
  independent = elt.checked;
  redrawScene();
}

function updateGradientOpacity(e) {
  const elt = e ? e.target : document.querySelector('.gradientOpacity');
  withGO = elt.checked ? 1 : 0;
  redrawScene();
}

function updateDataType(e) {
  const elt = e ? e.target : document.querySelector('.dataType');
  dataType = Number(elt.value);
  redrawScene();
}

document.querySelector('.lighting').addEventListener('input', updateLighting);

document
  .querySelector('.numComp')
  .addEventListener('input', updateNumberOfComponents);

document
  .querySelector('.independent')
  .addEventListener('input', updateIndependent);

document
  .querySelector('.gradientOpacity')
  .addEventListener('input', updateGradientOpacity);

document.querySelector('.dataType').addEventListener('input', updateDataType);

configureScene(lighting, numComp, independent, withGO, dataType);

renderer.resetCamera();
renderer.getActiveCamera().elevation(20);
renderer.resetCameraClippingRange();
sliceRenderer.addActor(sliceActor);
sliceRenderer.resetCamera();

renderWindow.render();
