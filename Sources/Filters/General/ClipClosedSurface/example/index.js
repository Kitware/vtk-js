import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkCamera from '@kitware/vtk.js/Rendering/Core/Camera';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkPlane from '@kitware/vtk.js/Common/DataModel/Plane';
import vtkClipClosedSurface from '@kitware/vtk.js/Filters/General/ClipClosedSurface';
import vtkSphereSource from '@kitware/vtk.js/Filters/Sources/SphereSource';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const NAMED_COLORS = {
  BANANA: [227 / 255, 207 / 255, 87 / 255],
  TOMATO: [255 / 255, 99 / 255, 71 / 255],
  SANDY_BROWN: [244 / 255, 164 / 255, 96 / 255],
};

const actor = vtkActor.newInstance();
renderer.addActor(actor);

const mapper = vtkMapper.newInstance({ interpolateScalarBeforeMapping: true });
actor.setMapper(mapper);

const cam = vtkCamera.newInstance();
renderer.setActiveCamera(cam);
cam.setFocalPoint(0, 0, 0);
cam.setPosition(0, 0, 10);
cam.setClippingRange(0.1, 50.0);

// Build pipeline
const source = vtkSphereSource.newInstance({
  thetaResolution: 20,
  phiResolution: 11,
});

const bounds = source.getOutputData().getBounds();
const center = [
  (bounds[1] + bounds[0]) / 2,
  (bounds[3] + bounds[2]) / 2,
  (bounds[5] + bounds[4]) / 2,
];
const planes = [];
const plane1 = vtkPlane.newInstance({
  origin: center,
  normal: [1.0, 0.0, 0.0],
});
planes.push(plane1);
const plane2 = vtkPlane.newInstance({
  origin: center,
  normal: [0.0, 1.0, 0.0],
});
planes.push(plane2);
const plane3 = vtkPlane.newInstance({
  origin: center,
  normal: [0.0, 0.0, 1.0],
});
planes.push(plane3);

const filter = vtkClipClosedSurface.newInstance({
  clippingPlanes: planes,
  activePlaneId: 2,
  clipColor: NAMED_COLORS.BANANA,
  baseColor: NAMED_COLORS.TOMATO,
  activePlaneColor: NAMED_COLORS.SANDY_BROWN,
  passPointData: false,
});
filter.setInputConnection(source.getOutputPort());
filter.setScalarModeToColors();
filter.update();
const filterData = filter.getOutputData();

mapper.setInputData(filterData);

// -----------------------------------------------------------

renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.source = source;
global.sourceData = source.getOutputData();
global.filter = filter;
global.filterData = filterData;
global.mapper = mapper;
global.actor = actor;
