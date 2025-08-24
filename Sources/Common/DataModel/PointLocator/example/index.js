import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';

import vtkSphereSource from '@kitware/vtk.js/Filters/Sources/SphereSource';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkPointLocator from '@kitware/vtk.js/Common/DataModel/PointLocator';
import vtkPoints from '@kitware/vtk.js/Common/Core/Points';

// ----------------------------------------------------------------------------
// Create renderer, render window, and interactor
// ----------------------------------------------------------------------------
const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Create sphere source
// ----------------------------------------------------------------------------
const sphereSource = vtkSphereSource.newInstance({
  thetaResolution: 8,
  phiResolution: 8,
  radius: 1.0,
});
sphereSource.update();

const sphereMapper = vtkMapper.newInstance();
sphereMapper.setInputConnection(sphereSource.getOutputPort());

const sphereActor = vtkActor.newInstance();
sphereActor.setMapper(sphereMapper);

// ----------------------------------------------------------------------------
// Create spot source
// ----------------------------------------------------------------------------
const spotSource = vtkSphereSource.newInstance({
  thetaResolution: 6,
  phiResolution: 6,
  radius: 0.1,
});
spotSource.update();

const spotMapper = vtkMapper.newInstance();
spotMapper.setInputConnection(spotSource.getOutputPort());

// ----------------------------------------------------------------------------
// Build a locator
// ----------------------------------------------------------------------------
const points = vtkPoints.newInstance({
  empty: true,
});
const locator = vtkPointLocator.newInstance();
locator.setDataSet(sphereSource.getOutputData());
locator.initPointInsertion(points, sphereSource.getOutputData().getBounds());
locator.buildLocator();

locator.insertUniquePoint([1, 2, 3]);
locator.insertUniquePoint([1, 2, 3]);

// ----------------------------------------------------------------------------
// Find closest point
// ----------------------------------------------------------------------------
const p1 = [0.1, -0.2, 0.2];
const ptId = locator.findClosestPoint(p1);
const closestPoint = sphereSource.getOutputData().getPoints().getPoint(ptId);
const closestPointActor = vtkActor.newInstance();
closestPointActor.setMapper(spotMapper);
closestPointActor.setPosition(
  closestPoint[0],
  closestPoint[1],
  closestPoint[2]
);
closestPointActor.getProperty().setColor(0.0, 1.0, 0.0);

// ----------------------------------------------------------------------------
// Find closest point within radius
// ----------------------------------------------------------------------------
const radius = 5.0;
const p2 = [0.2, 1.0, 1.0];
const outputdata = sphereSource.getOutputData();
const ptId2 = locator.findClosestPointWithinRadius(
  radius,
  p2,
  outputdata.getLength()
);
const closestPoint2 = sphereSource
  .getOutputData()
  .getPoints()
  .getPoint(ptId2.id);
const closestPointActor2 = vtkActor.newInstance();
closestPointActor2.setMapper(spotMapper);
closestPointActor2.setPosition(
  closestPoint2[0],
  closestPoint2[1],
  closestPoint2[2]
);
closestPointActor2.getProperty().setColor(0.0, 1.0, 0.0);

// ----------------------------------------------------------------------------
// Add actors and set background
// ----------------------------------------------------------------------------
renderer.addActor(sphereActor);
renderer.addActor(closestPointActor);
renderer.addActor(closestPointActor2);

// ----------------------------------------------------------------------------
// Render
// ----------------------------------------------------------------------------
renderer.resetCamera();
renderWindow.render();
