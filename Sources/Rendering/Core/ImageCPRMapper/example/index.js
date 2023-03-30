import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/All';

// Force the loading of HttpDataAccessHelper to support gzip decompression
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';

import vtkCPRManipulator from '@kitware/vtk.js/Widgets/Manipulators/CPRManipulator';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';
import vtkImageSlice from '@kitware/vtk.js/Rendering/Core/ImageSlice';
import vtkImageCPRMapper from '@kitware/vtk.js/Rendering/Core/ImageCPRMapper';
import vtkImageMapper from '@kitware/vtk.js/Rendering/Core/ImageMapper';
import vtkImageReslice from '@kitware/vtk.js/Imaging/Core/ImageReslice';
import vtkMatrixBuilder from '@kitware/vtk.js/Common/Core/MatrixBuilder';
import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData';
import vtkResliceCursorWidget from '@kitware/vtk.js/Widgets/Widgets3D/ResliceCursorWidget';
import vtkRenderer from '@kitware/vtk.js/Rendering/Core/Renderer';
import vtkTransform from '@kitware/vtk.js/Common/Transform/Transform';
import vtkWidgetManager from '@kitware/vtk.js/Widgets/Core/WidgetManager';
import { ViewTypes } from '@kitware/vtk.js/Widgets/Core/WidgetManager/Constants';

import controlPanel from './controller.html';

const volumePath = `${__BASE_PATH__}/data/volume/LIDC2.vti`;
const centerlinePaths = [`${__BASE_PATH__}/data/volume/centerline.json`];

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
fullScreenRenderer.addController(controlPanel);
const interactor = renderWindow.getInteractor();
interactor.setDesiredUpdateRate(15.0);

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------
// Server is not sending the .gz and with the compress header
// Need to fetch the true file name and uncompress it locally
// ----------------------------------------------------------------------------

const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });

const centerline = vtkPolyData.newInstance();

const actor = vtkImageSlice.newInstance();
const mapper = vtkImageCPRMapper.newInstance();
actor.setMapper(mapper);

mapper.setInputConnection(reader.getOutputPort(), 0);
mapper.setInputData(centerline, 1);
mapper.setWidth(400);

// Base orientations (mat4) coming from the JSON
let centerlineBasesArray = new Float32Array();
// Orientations rotated around the z-axis
let rotatedBasesArray = new Float32Array();

// The centerline JSON contains positions (vec3) and orientations (mat4)
function setCenterlineJson(centerlineJson) {
  // Set positions of the centerline (model coordinates)
  const centerlinePoints = Float32Array.from(centerlineJson.position);
  const nPoints = centerlinePoints.length / 3;
  centerline.getPoints().setData(centerlinePoints, 3);

  // Set polylines of the centerline
  const centerlineLines = new Uint16Array(1 + nPoints);
  centerlineLines[0] = nPoints;
  for (let i = 0; i < nPoints; ++i) {
    centerlineLines[i + 1] = i;
  }
  centerline.getLines().setData(centerlineLines);

  // Create a rotated basis data array to oriented the CPR
  centerlineBasesArray = Float32Array.from(centerlineJson.orientation);
  rotatedBasesArray = Float32Array.from(centerlineBasesArray);
  const rotatedBases = vtkDataArray.newInstance({
    name: 'Direction',
    numberOfComponents: 16,
    values: rotatedBasesArray,
  });
  centerline.getPointData().setTensors(rotatedBases);

  centerline.modified();
  renderWindow.render();
}

// Update the angle between centerlineBasesArray and rotatedBasesArray
function setCenterlineAngle(centerlineAngle) {
  const matrix = vtkMatrixBuilder
    .buildFromDegree()
    .rotateZ(centerlineAngle)
    .getMatrix();
  const zRotation = vtkTransform.newInstance({ matrix });
  zRotation.postMultiply(); // rotate around Z, then apply centerline matrix
  zRotation.transformMatrices(centerlineBasesArray, rotatedBasesArray);

  centerline.modified();
  renderWindow.render();
}

// Load all the centerline JSONs
const centerlineJsons = {};
const centerlinesLoaded = centerlinePaths.map(async (centerlinePath, i) => {
  const response = await fetch(centerlinePath);
  const centerlineJSON = await response.json();
  centerlineJsons[centerlinePath] = centerlineJSON;
  if (i === 0) {
    setCenterlineJson(centerlineJSON);
  }
});

// When loaded, create an option for each centerline
Promise.all(centerlinesLoaded).then(() => {
  const centerlineEl = document.getElementById('centerline');
  const centerlineJsonsKeys = Object.keys(centerlineJsons);
  for (let i = 0; i < centerlineJsonsKeys.length; ++i) {
    const name = centerlineJsonsKeys[i];
    const optionEl = document.createElement('option');
    optionEl.innerText = name;
    optionEl.value = name;
    centerlineEl.appendChild(optionEl);
  }
  centerlineEl.addEventListener('input', () => {
    setCenterlineJson(centerlineJsons[centerlineEl.value]);
  });
});

const angleEl = document.getElementById('reformationAngle');
angleEl.addEventListener('input', (e) =>
  setCenterlineAngle(Number(e.target.value))
);

// Reslice Cursor Widget
const widget = vtkResliceCursorWidget.newInstance({ planes: ['X', 'Y'] });
const widgetManager = vtkWidgetManager.newInstance();
widgetManager.setRenderer(renderer);
widgetManager.addWidget(widget, ViewTypes.YZ_PLANE);
const widgetState = widget.getWidgetState();
// Set size in CSS pixel space because scaleInPixels defaults to true
widgetState
  .getStatesWithLabel('sphere')
  .forEach((handle) => handle.setScale1(20));
widgetState.getCenterHandle().setVisible(false);
const crossRenderer = vtkRenderer.newInstance();
crossRenderer.setViewport(0.7, 0, 1, 0.3);
renderWindow.addRenderer(crossRenderer);
renderWindow.setNumberOfLayers(2);
crossRenderer.setLayer(1);
const crossWidgetManager = vtkWidgetManager.newInstance();
crossWidgetManager.setRenderer(crossRenderer);
crossWidgetManager.addWidget(widget, ViewTypes.XZ_PLANE);

const reslice = vtkImageReslice.newInstance();
reslice.setTransformInputSampling(false);
reslice.setAutoCropOutput(true);
reslice.setOutputDimensionality(2);
const resliceMapper = vtkImageMapper.newInstance();
resliceMapper.setInputConnection(reslice.getOutputPort());
const resliceActor = vtkImageSlice.newInstance();
resliceActor.setMapper(resliceMapper);

// FIXME: place widget center in middle of centerline
// widget.setCenter(middleOfCenterLine)
// FIXME: set cross view normal + viewUp of middle point of centerline
widget.getWidgetState().getPlanes()[ViewTypes.XZ_PLANE].normal = [0, 0, 1];
widget.getWidgetState().getPlanes()[ViewTypes.XZ_PLANE].viewUp = [0, 1, 0];
const cprManipulator = vtkCPRManipulator.newInstance();
// FIXME: pass centerline to CPR manipulator
widget.getWidgetState().getAxisXinY().setManipulator(cprManipulator);
widget.getWidgetState().getAxisYinX().setManipulator(cprManipulator);

// Read image
reader.setUrl(volumePath).then(() => {
  reader.loadData().then(() => {
    const image = reader.getOutputData();
    widget.setImage(image);

    // FIXME: place the center of actor on the center of centerline
    // actor.setOrigin(widget.getWidgetState().getCenter());
    // actor.setOrientation(image.getOrigin());
    actor.setUserMatrix(widget.getResliceAxes(ViewTypes.YZ_PLANE));
    renderer.addVolume(actor);
    widget.updateCameraPoints(renderer, ViewTypes.YZ_PLANE, true, false, true);

    reslice.setInputData(image);
    crossRenderer.addActor(resliceActor);
    widget.updateReslicePlane(reslice, ViewTypes.XZ_PLANE);
    resliceActor.setUserMatrix(reslice.getResliceAxes());
    widget.updateCameraPoints(
      crossRenderer,
      ViewTypes.XZ_PLANE,
      true,
      false,
      true
    );

    renderer.resetCamera();
    crossRenderer.resetCamera();
    interactor.render();

    global.imageData = image;
  });
});

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.source = reader;
global.mapper = mapper;
global.actor = actor;
global.renderer = renderer;
global.renderWindow = renderWindow;
global.centerline = centerline;
global.centerlineJsons = centerlineJsons;
