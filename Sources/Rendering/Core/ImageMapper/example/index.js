import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Volume';

import Constants from 'vtk.js/Sources/Rendering/Core/ImageMapper/Constants';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkRTAnalyticSource from 'vtk.js/Sources/Filters/Sources/RTAnalyticSource';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkInteractorStyleImage from 'vtk.js/Sources/Interaction/Style/InteractorStyleImage';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';

const { SlicingMode } = Constants;

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const rtSource = vtkRTAnalyticSource.newInstance();
rtSource.setWholeExtent(0, 200, 0, 200, 0, 200);
rtSource.setCenter(100, 100, 100);
rtSource.setStandardDeviation(0.3);

const mapper = vtkImageMapper.newInstance();
mapper.setInputConnection(rtSource.getOutputPort());
mapper.setSliceAtFocalPoint(true);
mapper.setSlicingMode(SlicingMode.Z);
// mapper.setZSlice(5);

const rgb = vtkColorTransferFunction.newInstance();
global.rgb = rgb;
rgb.addRGBPoint(0, 0, 0, 0);
rgb.addRGBPoint(255, 1, 1, 1);

const ofun = vtkPiecewiseFunction.newInstance();
global.ofun = ofun;
ofun.addPoint(0, 1);
ofun.addPoint(150, 1);
ofun.addPoint(180, 0);
ofun.addPoint(255, 0);

const actor = vtkImageSlice.newInstance();
actor.getProperty().setColorWindow(255);
actor.getProperty().setColorLevel(127);
// Uncomment this if you want to use a fixed colorwindow/level
// actor.getProperty().setRGBTransferFunction(rgb);
actor.getProperty().setPiecewiseFunction(ofun);
actor.setMapper(mapper);
renderer.addActor(actor);

const iStyle = vtkInteractorStyleImage.newInstance();
iStyle.setInteractionMode('IMAGE_SLICING');
renderWindow.getInteractor().setInteractorStyle(iStyle);

const camera = renderer.getActiveCamera();
const position = camera.getFocalPoint();
// offset along the slicing axis
const normal = mapper.getSlicingModeNormal();
position[0] += normal[0];
position[1] += normal[1];
position[2] += normal[2];
camera.setPosition(...position);
switch (mapper.getSlicingMode()) {
  case SlicingMode.X:
    camera.setViewUp([0, 1, 0]);
    break;
  case SlicingMode.Y:
    camera.setViewUp([1, 0, 0]);
    break;
  case SlicingMode.Z:
    camera.setViewUp([0, 1, 0]);
    break;
  default:
}
camera.setParallelProjection(true);
renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.source = rtSource;
global.mapper = mapper;
global.actor = actor;
global.renderer = renderer;
global.renderWindow = renderWindow;
