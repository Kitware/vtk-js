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
import vtkWidgetManager from '@kitware/vtk.js/Widgets/Core/WidgetManager';
import { ViewTypes } from '@kitware/vtk.js/Widgets/Core/WidgetManager/Constants';
import { vec3 } from 'gl-matrix';

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

// Reslice Cursor Widget
const widget = vtkResliceCursorWidget.newInstance({ planes: ['X', 'Y'] });
const widgetManager = vtkWidgetManager.newInstance();
widgetManager.setRenderer(renderer);
widgetManager.addWidget(widget, ViewTypes.YZ_PLANE);
const widgetState = widget.getWidgetState();

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

// The centerline JSON contains positions (vec3) and orientations (mat4)
let currentJson = null;
let currentImage = null;
function setCenterlineJson(centerlineJson) {
  currentJson = centerlineJson;
  if (!currentImage) {
    return;
  }
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
  centerline.getPointData().setTensors(
    vtkDataArray.newInstance({
      name: 'Orientation',
      numberOfComponents: 16,
      values: Float32Array.from(centerlineJson.orientation),
    })
  );
  centerline.modified();

  const midPointDistance = mapper.getHeight() / 2;
  const { position, orientation } =
    mapper.getCenterlinePositionAndOrientation(midPointDistance);
  // Set center of the widget
  if (position) {
    widget.setCenter(position);
  }
  // Set normal and viewUp of the plane
  if (orientation) {
    const baseNormal = mapper.getNormalDirection();
    const normal = vec3.transformQuat([], baseNormal, orientation);
    const baseBitangent = mapper.getBitangentDirection();
    const bitangent = vec3.transformQuat([], baseBitangent, orientation);
    const planes = widgetState.getPlanes();
    planes[ViewTypes.XZ_PLANE] = { normal: bitangent, viewUp: normal };
    planes[ViewTypes.YZ_PLANE] = { normal, viewUp: bitangent };
    widgetState.setPlanes(planes);
  }

  const cprManipulator = vtkCPRManipulator.newInstance();
  // FIXME: pass centerline to cpr manipulator
  widgetState.getAxisXinY().setManipulator(cprManipulator);
  widgetState.getAxisYinX().setManipulator(cprManipulator);

  renderWindow.render();
}

// Update the angle of reformation
function setCenterlineAngle(centerlineAngle) {
  const matrix = vtkMatrixBuilder
    .buildFromDegree()
    .rotateZ(centerlineAngle)
    .getMatrix();
  mapper.setTangentDirection(matrix.subarray(0, 3));
  mapper.setBitangentDirection(matrix.subarray(4, 7));

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

// Read image
reader.setUrl(volumePath).then(() => {
  reader.loadData().then(() => {
    const image = reader.getOutputData();
    widget.setImage(image);

    // FIXME: place the center of actor on the center of centerline
    // actor.setOrigin(widgetState.getCenter());
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

    currentImage = image;
    setCenterlineJson(currentJson);

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
