import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/All';

// Force the loading of HttpDataAccessHelper to support gzip decompression
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';

import { radiansFromDegrees } from 'vtk.js/Sources/Common/Core/Math';
import { updateState } from 'vtk.js/Sources/Widgets/Widgets3D/ResliceCursorWidget/helpers';
import { vec3, mat3, mat4 } from 'gl-matrix';
import { ViewTypes } from '@kitware/vtk.js/Widgets/Core/WidgetManager/Constants';
import vtkCPRManipulator from '@kitware/vtk.js/Widgets/Manipulators/CPRManipulator';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';
import vtkImageCPRMapper from '@kitware/vtk.js/Rendering/Core/ImageCPRMapper';
import vtkImageMapper from '@kitware/vtk.js/Rendering/Core/ImageMapper';
import vtkImageReslice from '@kitware/vtk.js/Imaging/Core/ImageReslice';
import vtkImageSlice from '@kitware/vtk.js/Rendering/Core/ImageSlice';
import vtkInteractorStyleImage from '@kitware/vtk.js/Interaction/Style/InteractorStyleImage';
import vtkPlaneManipulator from '@kitware/vtk.js/Widgets/Manipulators/PlaneManipulator';
import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData';
import vtkRenderer from '@kitware/vtk.js/Rendering/Core/Renderer';
import vtkResliceCursorWidget from '@kitware/vtk.js/Widgets/Widgets3D/ResliceCursorWidget';
import vtkWidgetManager from '@kitware/vtk.js/Widgets/Core/WidgetManager';
import widgetBehavior from 'vtk.js/Sources/Widgets/Widgets3D/ResliceCursorWidget/cprBehavior';

import controlPanel from './controller.html';
import centerlineJSON from './centerline.json';

const volumePath = `${__BASE_PATH__}/data/volume/LIDC2.vti`;
const centerlineJsons = { 'Base centerline': centerlineJSON };
const centerlineKeys = Object.keys(centerlineJsons);

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const stretchRenderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

fullScreenRenderer.addController(controlPanel);
const angleEl = document.getElementById('angle');
const centerlineEl = document.getElementById('centerline');

const interactor = renderWindow.getInteractor();
interactor.setInteractorStyle(vtkInteractorStyleImage.newInstance());
interactor.setDesiredUpdateRate(15.0);

// Reslice Cursor Widget
const stretchPlane = 'Y';
const crossPlane = 'Z';
const widget = vtkResliceCursorWidget.newInstance({
  planes: [stretchPlane, crossPlane],
  behavior: widgetBehavior,
});
const widgetManager = vtkWidgetManager.newInstance();
widgetManager.setRenderer(stretchRenderer);
const stretchViewType = ViewTypes.XZ_PLANE;
const crossViewType = ViewTypes.XY_PLANE;
const stretchViewWidgetInstance = widgetManager.addWidget(
  widget,
  stretchViewType
);
const widgetState = widget.getWidgetState();

// Set size in CSS pixel space because scaleInPixels defaults to true
widgetState
  .getStatesWithLabel('sphere')
  .forEach((handle) => handle.setScale1(20));
widgetState.getCenterHandle().setVisible(false);
widgetState
  .getStatesWithLabel(`rotationIn${stretchPlane}`)
  .forEach((handle) => handle.setVisible(false));

const crossRenderer = vtkRenderer.newInstance();
crossRenderer.setViewport(0.7, 0, 1, 0.3);
renderWindow.addRenderer(crossRenderer);
renderWindow.setNumberOfLayers(2);
crossRenderer.setLayer(1);
const crossWidgetManager = vtkWidgetManager.newInstance();
crossWidgetManager.setRenderer(crossRenderer);
const crossViewWidgetInstance = crossWidgetManager.addWidget(
  widget,
  crossViewType
);

const reslice = vtkImageReslice.newInstance();
reslice.setTransformInputSampling(false);
reslice.setAutoCropOutput(true);
reslice.setOutputDimensionality(2);
const resliceMapper = vtkImageMapper.newInstance();
resliceMapper.setBackgroundColor(0, 0, 0, 0);
resliceMapper.setInputConnection(reslice.getOutputPort());
const resliceActor = vtkImageSlice.newInstance();
resliceActor.setMapper(resliceMapper);

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
mapper.setBackgroundColor(0, 0, 0, 0);
actor.setMapper(mapper);

mapper.setInputConnection(reader.getOutputPort(), 0);
mapper.setInputData(centerline, 1);
mapper.setWidth(400);

const cprManipulator = vtkCPRManipulator.newInstance({
  cprActor: actor,
});
const planeManipulator = vtkPlaneManipulator.newInstance();

function updateDistanceAndDirection() {
  // Directions and position in world space from the widget
  const widgetPlanes = widgetState.getPlanes();
  const worldBitangent = widgetPlanes[stretchViewType].normal;
  const worldNormal = widgetPlanes[stretchViewType].viewUp;
  widgetPlanes[crossViewType].normal = worldNormal;
  widgetPlanes[crossViewType].viewUp = worldBitangent;
  const worldTangent = vec3.cross([], worldBitangent, worldNormal);
  vec3.normalize(worldTangent, worldTangent);
  const worldWidgetCenter = widgetState.getCenter();

  const width = mapper.getWidth();
  const height = mapper.getHeight();
  const distance = cprManipulator.getCurrentDistance();

  // CPR actor matrix update
  const worldActorTranslation = vec3.scaleAndAdd(
    [],
    worldWidgetCenter,
    worldTangent,
    -0.5 * width
  );
  vec3.scaleAndAdd(
    worldActorTranslation,
    worldActorTranslation,
    worldNormal,
    distance - height
  );
  const worldActorTransform = mat4.fromValues(
    ...worldTangent,
    0,
    ...worldNormal,
    0,
    ...vec3.scale([], worldBitangent, -1),
    0,
    ...worldActorTranslation,
    1
  );
  actor.setUserMatrix(worldActorTransform);

  // CPR camera reset
  const stretchCamera = stretchRenderer.getActiveCamera();
  const cameraDistance =
    (0.5 * height) /
    Math.tan(radiansFromDegrees(0.5 * stretchCamera.getViewAngle()));
  stretchCamera.setParallelScale(0.5 * height);
  stretchCamera.setParallelProjection(true);
  const cameraFocalPoint = vec3.scaleAndAdd(
    [],
    worldWidgetCenter,
    worldNormal,
    distance - 0.5 * height
  );
  const cameraPosition = vec3.scaleAndAdd(
    [],
    cameraFocalPoint,
    worldBitangent,
    -cameraDistance
  );
  stretchCamera.setPosition(...cameraPosition);
  stretchCamera.setFocalPoint(...cameraFocalPoint);
  stretchCamera.setViewUp(...worldNormal);
  stretchRenderer.resetCameraClippingRange();
  interactor.render();

  // CPR mapper tangent and bitangent directions update
  const { orientation } = mapper.getCenterlinePositionAndOrientation(distance);
  // modelDirections * baseDirections = worldDirections
  // => baseDirections = modelDirections^(-1) * worldDirections
  const modelDirections = mat3.fromQuat([], orientation);
  const inverseModelDirections = mat3.invert([], modelDirections);
  const worldDirections = mat3.fromValues(
    ...worldTangent,
    ...worldBitangent,
    ...worldNormal
  );
  const baseDirections = mat3.mul([], inverseModelDirections, worldDirections);
  mapper.setDirectionMatrix(baseDirections);

  // Cross renderer update
  widget.updateReslicePlane(reslice, crossViewType);
  resliceActor.setUserMatrix(reslice.getResliceAxes());
  widget.updateCameraPoints(crossRenderer, crossViewType, false, true, false);
  const crossCamera = crossRenderer.getActiveCamera();
  crossCamera.setViewUp(
    modelDirections[3],
    modelDirections[4],
    modelDirections[5]
  );

  // Update plane manipulator origin / normal for the cross view
  planeManipulator.setUserOrigin(worldWidgetCenter);
  planeManipulator.setUserNormal(worldNormal);

  // Find the angle
  const signedRadAngle = Math.atan2(baseDirections[1], baseDirections[0]);
  const signedDegAngle = (signedRadAngle * 180) / Math.PI;
  const degAngle = signedDegAngle > 0 ? signedDegAngle : 360 + signedDegAngle;
  angleEl.value = degAngle;
  updateState(
    widgetState,
    widget.getScaleInPixels(),
    widget.getRotationHandlePosition()
  );
  renderWindow.render();
}

// The centerline JSON contains positions (vec3) and orientations (mat4)
let currentCenterlineKey = centerlineKeys[0];
let currentImage = null;
function setCenterlineKey(centerlineKey) {
  currentCenterlineKey = centerlineKey;
  const centerlineJson = centerlineJsons[centerlineKey];
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
  cprManipulator.setCurrentDistance(midPointDistance);
  updateDistanceAndDirection();

  widgetState[`getAxis${crossPlane}in${stretchPlane}`]().setManipulator(
    cprManipulator
  );
  widgetState[`getAxis${stretchPlane}in${crossPlane}`]().setManipulator(
    planeManipulator
  );
  widget.setManipulator(cprManipulator);

  renderWindow.render();
}

// Create an option for each centerline
for (let i = 0; i < centerlineKeys.length; ++i) {
  const name = centerlineKeys[i];
  const optionEl = document.createElement('option');
  optionEl.innerText = name;
  optionEl.value = name;
  centerlineEl.appendChild(optionEl);
}
centerlineEl.addEventListener('input', () =>
  setCenterlineKey(centerlineEl.value)
);

// Read image
reader.setUrl(volumePath).then(() => {
  reader.loadData().then(() => {
    const image = reader.getOutputData();
    widget.setImage(image);
    const imageDimensions = image.getDimensions();
    const imageSpacing = image.getSpacing();
    const diagonal = vec3.mul([], imageDimensions, imageSpacing);
    mapper.setWidth(2 * vec3.len(diagonal));

    actor.setUserMatrix(widget.getResliceAxes(stretchViewType));
    stretchRenderer.addVolume(actor);
    widget.updateCameraPoints(
      stretchRenderer,
      stretchViewType,
      true,
      false,
      true
    );

    reslice.setInputData(image);
    crossRenderer.addActor(resliceActor);
    widget.updateReslicePlane(reslice, crossViewType);
    resliceActor.setUserMatrix(reslice.getResliceAxes());
    widget.updateCameraPoints(crossRenderer, crossViewType, true, false, true);

    currentImage = image;
    setCenterlineKey(currentCenterlineKey);

    global.imageData = image;
  });
});

function setAngleFromSlider(radAngle) {
  // Compute normal and bitangent directions from angle
  const origin = [0, 0, 0];
  const normalDir = [0, 0, 1];
  const bitangentDir = [0, 1, 0];
  vec3.rotateZ(bitangentDir, bitangentDir, origin, radAngle);

  // Get orientation from distance
  const distance = cprManipulator.getCurrentDistance();
  const { orientation } = mapper.getCenterlinePositionAndOrientation(distance);
  const modelDirections = mat3.fromQuat([], orientation);

  // Set widget normal and viewUp from orientation and directions
  const worldBitangent = vec3.transformMat3([], bitangentDir, modelDirections);
  const worldNormal = vec3.transformMat3([], normalDir, modelDirections);
  const widgetPlanes = widgetState.getPlanes();
  widgetPlanes[stretchViewType].normal = worldBitangent;
  widgetPlanes[stretchViewType].viewUp = worldNormal;
  widgetPlanes[crossViewType].normal = worldNormal;
  widgetPlanes[crossViewType].viewUp = worldBitangent;
  widgetState.setPlanes(widgetPlanes);

  updateDistanceAndDirection();
}

angleEl.addEventListener('input', () =>
  setAngleFromSlider(radiansFromDegrees(Number.parseFloat(angleEl.value, 10)))
);

stretchViewWidgetInstance.onInteractionEvent(updateDistanceAndDirection);
crossViewWidgetInstance.onInteractionEvent(updateDistanceAndDirection);

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.source = reader;
global.mapper = mapper;
global.actor = actor;
global.renderer = stretchRenderer;
global.renderWindow = renderWindow;
global.centerline = centerline;
global.centerlines = centerlineJsons;
