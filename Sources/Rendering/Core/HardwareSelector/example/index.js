/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */

import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';

import { throttle } from 'vtk.js/Sources/macros';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkCylinderSource from 'vtk.js/Sources/Filters/Sources/CylinderSource';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkGlyph3DMapper from 'vtk.js/Sources/Rendering/Core/Glyph3DMapper';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import { FieldAssociations } from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';
import { Representation } from 'vtk.js/Sources/Rendering/Core/Property/Constants';

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const WHITE = [1, 1, 1];
const GREEN = [0.1, 0.8, 0.1];

// ----------------------------------------------------------------------------
// Create DOM tooltip
// ----------------------------------------------------------------------------

const tooltipElem = document.createElement('div');
tooltipElem.style.position = 'absolute';
tooltipElem.style.top = 0;
tooltipElem.style.left = 0;
tooltipElem.style.width = '150px';
tooltipElem.style.padding = '10px';
tooltipElem.style.zIndex = 1;
tooltipElem.style.background = 'white';
tooltipElem.style.textAlign = 'center';

document.querySelector('body').appendChild(tooltipElem);

// ----------------------------------------------------------------------------
// Create 4 objects
// - sphere
// - sphere rendered as big points (square)
// - cone
// - cylinder with sphere as point (glyph mapper: source=cylinder, glyph=sphere)
// ----------------------------------------------------------------------------

// Sphere -------------------------------------------------

const sphereSource = vtkSphereSource.newInstance({
  phiResolution: 30,
  thetaResolution: 30,
});

const sphereMapper = vtkMapper.newInstance();
const sphereActor = vtkActor.newInstance();
sphereActor.setMapper(sphereMapper);
sphereMapper.setInputConnection(sphereSource.getOutputPort());

// Sphere with point representation -----------------------

const spherePointsSource = vtkSphereSource.newInstance({
  phiResolution: 15,
  thetaResolution: 15,
  radius: 0.6,
});
const spherePointsMapper = vtkMapper.newInstance();
const spherePointsActor = vtkActor.newInstance();
spherePointsActor.setMapper(spherePointsMapper);
spherePointsMapper.setInputConnection(spherePointsSource.getOutputPort());

// Use point representation
spherePointsActor.getProperty().setRepresentation(Representation.POINTS);
spherePointsActor.getProperty().setPointSize(20);

// Cone ---------------------------------------------------

const coneSource = vtkConeSource.newInstance({ resolution: 20 });
const coneMapper = vtkMapper.newInstance();
const coneActor = vtkActor.newInstance();
coneActor.setMapper(coneMapper);
coneMapper.setInputConnection(coneSource.getOutputPort());

// Cylinder -----------------------------------------------

const cylinderSource = vtkCylinderSource.newInstance({
  resolution: 10,
  radius: 0.4,
  height: 0.6,
  direction: [1.0, 0.0, 0.0],
});
const cylinderMapper = vtkGlyph3DMapper.newInstance({
  scaling: true,
  scaleFactor: 0.25,
  scaleMode: vtkGlyph3DMapper.ScaleModes.SCALE_BY_MAGNITUDE,
  scaleArray: 'scale',
});
const cylinderActor = vtkActor.newInstance();
const cylinderGlyph = sphereSource.getOutputData();
const cylinderPointSet = cylinderSource.getOutputData();
cylinderActor.setMapper(cylinderMapper);
cylinderMapper.setInputData(cylinderPointSet, 0);
cylinderMapper.setInputData(cylinderGlyph, 1);

// Add fields to cylinderPointSet
const scaleArray = new Float32Array(cylinderPointSet.getNumberOfPoints());
scaleArray.fill(0.5);
cylinderPointSet.getPointData().addArray(
  vtkDataArray.newInstance({
    name: 'scale',
    values: scaleArray,
  })
);

// ----------------------------------------------------------------------------
// Create Picking pointer
// ----------------------------------------------------------------------------

const pointerSource = vtkSphereSource.newInstance({
  phiResolution: 15,
  thetaResolution: 15,
  radius: 0.01,
});
const pointerMapper = vtkMapper.newInstance();
const pointerActor = vtkActor.newInstance();
pointerActor.setMapper(pointerMapper);
pointerMapper.setInputConnection(pointerSource.getOutputPort());

// ----------------------------------------------------------------------------
// Create rendering infrastructure
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = renderer.getRenderWindow();
const interactor = renderWindow.getInteractor();
const apiSpecificRenderWindow = interactor.getView();

renderer.addActor(sphereActor);
renderer.addActor(spherePointsActor);
renderer.addActor(coneActor);
renderer.addActor(cylinderActor);
renderer.addActor(pointerActor);

renderer.resetCamera();
renderWindow.render();

// ----------------------------------------------------------------------------
// Create hardware selector
// ----------------------------------------------------------------------------

const hardwareSelector = apiSpecificRenderWindow.getSelector();
hardwareSelector.setCaptureZValues(true);
hardwareSelector.setFieldAssociation(FieldAssociations.FIELD_ASSOCIATION_CELLS);

// ----------------------------------------------------------------------------
// Create Mouse listener for picking on mouse move
// ----------------------------------------------------------------------------

function eventToWindowXY(event) {
  // We know we are full screen => window.innerXXX
  // Otherwise we can use pixel device ratio or else...
  const { clientX, clientY } = event;
  const [width, height] = apiSpecificRenderWindow.getSize();
  const x = Math.round((width * clientX) / window.innerWidth);
  const y = Math.round(height * (1 - clientY / window.innerHeight)); // Need to flip Y
  return [x, y];
}

// ----------------------------------------------------------------------------

let needGlyphCleanup = false;
let lastProcessedActor = null;

const updateWorldPosition = (worldPosition) => {
  if (lastProcessedActor) {
    pointerActor.setVisibility(true);
    tooltipElem.innerHTML = worldPosition.map((v) => v.toFixed(3)).join(' , ');
    pointerActor.setPosition(worldPosition);
  } else {
    pointerActor.setVisibility(false);
    tooltipElem.innerHTML = '';
  }
  renderWindow.render();
};

function processSelections(selections) {
  if (!selections || selections.length === 0) {
    renderer.getActors().forEach((a) => a.getProperty().setColor(...WHITE));
    pointerActor.setVisibility(false);
    renderWindow.render();
    lastProcessedActor = null;
    return;
  }

  const { worldPosition, compositeID, prop, attributeID } =
    selections[0].getProperties();
  let cursorPosition = [...worldPosition];
  if (attributeID || attributeID === 0) {
    const input = prop.getMapper().getInputData();
    if (!input.getCells()) {
      input.buildCells();
    }
    if (
      hardwareSelector.getFieldAssociation() ===
      FieldAssociations.FIELD_ASSOCIATION_POINTS
    ) {
      const points = input.getPoints();
      const point = points.getTuple(attributeID);
      cursorPosition = [...point];
    } else {
      const cellPoints = input.getCellPoints(attributeID);
      if (cellPoints) {
        const pointIds = cellPoints.cellPointIds;
        const points = [];
        // Find the closest cell point, and use that as cursor position
        pointIds.forEach((pointId) => {
          points.push(input.getPoints().getPoint(pointId, []));
        });
        const distance = (pA, pB) =>
          vtkMath.distance2BetweenPoints(pA, worldPosition) -
          vtkMath.distance2BetweenPoints(pB, worldPosition);
        const sorted = points.sort(distance);
        cursorPosition = [...sorted[0]];
      }
    }
  } else if (lastProcessedActor === prop) {
    // Skip render call when nothing change
    return;
  }
  updateWorldPosition(cursorPosition);
  lastProcessedActor = prop;

  // Make the picked actor green
  renderer.getActors().forEach((a) => a.getProperty().setColor(...WHITE));
  prop.getProperty().setColor(...GREEN);

  // We hit the glyph, let's scale the picked glyph
  if (prop === cylinderActor) {
    scaleArray.fill(0.5);
    scaleArray[compositeID] = 0.7;
    cylinderPointSet.modified();
    needGlyphCleanup = true;
  } else if (needGlyphCleanup) {
    needGlyphCleanup = false;
    scaleArray.fill(0.5);
    cylinderPointSet.modified();
  }

  // Update picture for the user so we can see the green one
  updateWorldPosition(worldPosition);
}

// ----------------------------------------------------------------------------

function pickOnMouseEvent(event) {
  if (interactor.isAnimating()) {
    // We should not do picking when interacting with the scene
    return;
  }
  const [x, y] = eventToWindowXY(event);

  pointerActor.setVisibility(false);
  hardwareSelector.getSourceDataAsync(renderer, x, y, x, y).then((result) => {
    if (result) {
      processSelections(result.generateSelection(x, y, x, y));
    } else {
      processSelections(null);
    }
  });
}
const throttleMouseHandler = throttle(pickOnMouseEvent, 100);

document.addEventListener('mousemove', throttleMouseHandler);
