import 'vtk.js/Sources/favicon';

import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkInteractorStyleTrackballCamera from 'vtk.js/Sources/Interaction/Style/InteractorStyleTrackballCamera';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import Constants from 'vtk.js/Sources/Rendering/Core/ImageMapper/Constants';

const { SlicingMode } = Constants;

// Create some control UI
const container = document.querySelector('body');
container.style.width = '450px';
container.style.height = '450px';
const renderWindowContainer = document.createElement('div');
container.appendChild(renderWindowContainer);

// create what we will view
const renderWindow = vtkRenderWindow.newInstance();
const renderer = vtkRenderer.newInstance();
renderWindow.addRenderer(renderer);
renderer.setBackground(0.2, 0.2, 0.2);

const actor = vtkVolume.newInstance();

const mapper = vtkVolumeMapper.newInstance();
mapper.setSampleDistance(0.7);
actor.setMapper(mapper);

// now create something to view it, in this case webgl
const glwindow = vtkOpenGLRenderWindow.newInstance();
glwindow.setContainer(renderWindowContainer);
renderWindow.addView(glwindow);
glwindow.setSize(400, 400);

// Interactor
const interactor = vtkRenderWindowInteractor.newInstance();
interactor.setStillUpdateRate(0.01);
interactor.setView(glwindow);
interactor.initialize();
interactor.bindEvents(renderWindowContainer);
interactor.setInteractorStyle(vtkInteractorStyleTrackballCamera.newInstance());

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
actor.getProperty().setRGBTransferFunction(2, ctfun2);
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
sliceRenderer.setViewport([0.1, 0.6, 0.4, 0.9]);
renderWindow.addRenderer(sliceRenderer);
renderWindow.setNumberOfLayers(2);
// On top
sliceRenderer.setLayer(0);
sliceRenderer.setInteractive(false);
sliceRenderer.setBackground(0.4, 0.4, 0.4);
const sliceMapper = vtkImageMapper.newInstance();
const sliceActor = vtkImageSlice.newInstance();
sliceActor.setMapper(sliceMapper);
sliceActor.getProperty().setRGBTransferFunction(0, ctfun);
sliceActor.getProperty().setScalarOpacity(0, ofun);
sliceActor.getProperty().setComponentWeight(0, 1.0);
sliceActor.getProperty().setRGBTransferFunction(1, ctfun2);
sliceActor.getProperty().setScalarOpacity(1, ofun);
sliceActor.getProperty().setComponentWeight(1, 1.0);
sliceActor.getProperty().setRGBTransferFunction(2, ctfun3);
sliceActor.getProperty().setScalarOpacity(2, ofun);
sliceActor.getProperty().setComponentWeight(2, 1.0);
sliceActor.getProperty().setRGBTransferFunction(3, ctfun4);
sliceActor.getProperty().setScalarOpacity(3, ofun);
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
let animcb;
let totalCount = 0;
let lighting = 1;
// let numComp = 4;
let numComp = 1;
let independent = 1;
let withGO = 1;
let dataType = 2;
const testAVolume = () => {
  // if (totalCount >= 1) {
  if (totalCount >= 120 * 3 * 2 * 4 * 2 * 2) {
    interactor.cancelAnimation(actor);
    animcb.unsubscribe();
    return;
  }

  // do we need to update?
  if (totalCount % 120 === 0) {
    // update lighting
    if (totalCount % (720 * 4 * 2) === 0) {
      lighting = (lighting + 1) % 2;
      actor.getProperty().setShade(lighting);
    }
    // update independent
    if (totalCount % (720 * 4) === 0) {
      independent = (independent + 1) % 2;
      actor.getProperty().setIndependentComponents(independent);
      sliceActor.getProperty().setIndependentComponents(independent);
    }
    // update numComp
    if (totalCount % 720 === 0) {
      numComp = (numComp % 4) + 1;
    }
    // update withGO?
    if (totalCount % 360 === 0) {
      withGO = (withGO + 1) % 2;
      actor.getProperty().setUseGradientOpacity(0, withGO);
      actor.getProperty().setUseGradientOpacity(1, withGO);
      actor.getProperty().setUseGradientOpacity(2, withGO);
      actor.getProperty().setUseGradientOpacity(3, withGO);
    }

    // create a synthetic volume with multiple components
    const id = vtkImageData.newInstance();
    id.setExtent(0, 99, 0, 99, 0, 199);

    let newArray;
    dataType = (dataType + 1) % 3;
    if (dataType === 0) {
      newArray = new Uint8Array(200 * 100 * 100 * numComp);
    }
    if (dataType === 1) {
      newArray = new Int16Array(200 * 100 * 100 * numComp);
    }
    if (dataType === 2) {
      newArray = new Float32Array(200 * 100 * 100 * numComp);
    }

    for (let c = 0; c < numComp - 1; ++c) {
      actor.getProperty().setComponentWeight(c, 0.2);
    }
    actor.getProperty().setComponentWeight(numComp - 1, 1.0);

    let i = 0;
    for (let z = 0; z <= 199; z++) {
      for (let y = 0; y <= 99; y++) {
        for (let x = 0; x <= 99; x++) {
          newArray[i] =
            40.0 *
            (3.0 + Math.cos(x / 20.0) + Math.cos(y / 10.0) + Math.cos(z / 5.0));
          if (numComp >= 2) {
            newArray[i + 1] = independent ? 0.2 * z : 1.25 * z;
          }
          if (numComp >= 3) {
            newArray[i + 2] = 125.0 * Math.cos(y / 10.0) + 128.0;
          }
          if (numComp >= 4) {
            newArray[i + 3] = 125.0 * Math.cos((x + z) / 15.0) + 128.0;
          }
          i += numComp;
        }
      }
    }

    const da = vtkDataArray.newInstance({
      numberOfComponents: numComp,
      values: newArray,
    });
    da.setName('scalars');

    const cpd = id.getPointData();
    cpd.setScalars(da);

    mapper.setInputData(id);
    // sliceMapper.setSliceAtFocalPoint(true);
    sliceMapper.setSlicingMode(SlicingMode.Z);
    sliceMapper.setZSlice(100);
    sliceMapper.setInputData(id);

    console.log(
      `shade=${lighting} independent=${independent} numComponents=${numComp} GO=${withGO} dataType=${dataType}`
    );

    if (totalCount === 0) {
      renderer.resetCamera();
      renderer.getActiveCamera().elevation(20);
      renderer.resetCameraClippingRange();
      sliceRenderer.addActor(sliceActor);
      sliceRenderer.resetCamera();
    }
  }

  totalCount++;
  renderer.getActiveCamera().azimuth(1);
  renderWindow.render();
};

animcb = interactor.onAnimation(testAVolume);

interactor.requestAnimation(actor);
