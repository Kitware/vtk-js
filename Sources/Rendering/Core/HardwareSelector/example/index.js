/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */

import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import '@kitware/vtk.js/Rendering/OpenGL/Glyph3DMapper';

import { throttle } from '@kitware/vtk.js/macros';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
import vtkCylinderSource from '@kitware/vtk.js/Filters/Sources/CylinderSource';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkGlyph3DMapper from '@kitware/vtk.js/Rendering/Core/Glyph3DMapper';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkSphereSource from '@kitware/vtk.js/Filters/Sources/SphereSource';
import vtkCubeSource from '@kitware/vtk.js/Filters/Sources/CubeSource';
import vtkPolydata from '@kitware/vtk.js/Common/DataModel/PolyData';
import vtkMatrixBuilder from '@kitware/vtk.js/Common/Core/MatrixBuilder';
import { mat4 } from 'gl-matrix';
import vtkMath from '@kitware/vtk.js/Common/Core/Math';
import { FieldAssociations } from '@kitware/vtk.js/Common/DataModel/DataSet/Constants';
import { Representation } from '@kitware/vtk.js/Rendering/Core/Property/Constants';

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const WHITE = [1, 1, 1];
const GREEN = [0.1, 0.8, 0.1];

// ----------------------------------------------------------------------------
// Create DOM tooltip
// ----------------------------------------------------------------------------

const tooltipsElem = document.createElement('div');
tooltipsElem.style.position = 'absolute';
tooltipsElem.style.top = 0;
tooltipsElem.style.left = 0;
tooltipsElem.style.padding = '10px';
tooltipsElem.style.zIndex = 1;
tooltipsElem.style.background = 'white';
tooltipsElem.style.textAlign = 'center';

const positionTooltipElem = document.createElement('div');
const fieldIdTooltipElem = document.createElement('div');
const compositeIdTooltipElem = document.createElement('div');
const propIdTooltipElem = document.createElement('div');
tooltipsElem.appendChild(positionTooltipElem);
tooltipsElem.appendChild(propIdTooltipElem);
tooltipsElem.appendChild(fieldIdTooltipElem);
tooltipsElem.appendChild(compositeIdTooltipElem);

document.querySelector('body').appendChild(tooltipsElem);

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
sphereActor.getProperty().setEdgeVisibility(true);
sphereMapper.setInputConnection(sphereSource.getOutputPort());

// Cube -------------------------------------------------

const cubeSource = vtkCubeSource.newInstance({
  xLength: 1,
  yLength: 1,
  zLength: 1,
});

const cubeMapper = vtkMapper.newInstance();
const cubeActor = vtkActor.newInstance({ position: [-1, 0, 0] });
cubeActor.setMapper(cubeMapper);
cubeActor.getProperty().setEdgeVisibility(true);
cubeMapper.setInputConnection(cubeSource.getOutputPort());

// Sphere with point representation -----------------------

const spherePointsSource = vtkSphereSource.newInstance({
  phiResolution: 15,
  thetaResolution: 15,
  radius: 0.6,
});
const spherePointsMapper = vtkMapper.newInstance();
const spherePointsActor = vtkActor.newInstance({ position: [0, -1, 0] });
spherePointsActor.setMapper(spherePointsMapper);
spherePointsMapper.setInputConnection(spherePointsSource.getOutputPort());

// Use point representation
spherePointsActor.getProperty().setRepresentation(Representation.POINTS);
spherePointsActor.getProperty().setPointSize(20);

// Cone ---------------------------------------------------

const coneSource = vtkConeSource.newInstance({ resolution: 20 });
const coneMapper = vtkMapper.newInstance();
const coneActor = vtkActor.newInstance({ position: [1, 0, 0] });
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
const cylinderActor = vtkActor.newInstance({ position: [0, 1, 0] });
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

// PolyLines -------------------------------------------------

const polyLinesMapper = vtkMapper.newInstance();
const polyLinesData = vtkPolydata.newInstance();
const squarePoints = [-1, 2, 0, 0, 2, 0, 0, 1, 0, -1, 1, 0];
const trianglePoints = [1, 2, 0, 1, 1, 0, 2, 1.5, 0];
polyLinesData
  .getPoints()
  .setData(Float32Array.from([...squarePoints, ...trianglePoints]), 3);
polyLinesData
  .getLines()
  .setData(Uint16Array.from([5, 0, 1, 2, 3, 0, 4, 4, 5, 6, 4]));
polyLinesMapper.setInputData(polyLinesData);

const polyLines = vtkActor.newInstance();
polyLines.setMapper(polyLinesMapper);

// An actor made of 3 cells: a vertex, a line and triangle -------------------------------------------------

const multiPrimitiveMapper = vtkMapper.newInstance();
const multiPrimitiveData = vtkPolydata.newInstance();
const multiPrimitivePoints = [
  1, 0.75, 0, 2, 1, 0, 2, 0.75, 0, 1.5, 1, 0, 1, 0.5, 0, 2, 0.5, 0,
];
multiPrimitiveData
  .getPoints()
  .setData(Float32Array.from(multiPrimitivePoints), 3);
multiPrimitiveData.getVerts().setData(Uint16Array.from([1, 0]));
multiPrimitiveData.getLines().setData(Uint16Array.from([2, 1, 2]));
multiPrimitiveData.getPolys().setData(Uint16Array.from([3, 3, 4, 5]));
multiPrimitiveMapper.setInputData(multiPrimitiveData);

const multiPrimitive = vtkActor.newInstance();
multiPrimitive.setMapper(multiPrimitiveMapper);

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
renderer.addActor(cubeActor);
renderer.addActor(spherePointsActor);
renderer.addActor(coneActor);
renderer.addActor(cylinderActor);
renderer.addActor(pointerActor);
renderer.addActor(polyLines);
renderer.addActor(multiPrimitive);

renderer.resetCamera();
renderWindow.render();

// ----------------------------------------------------------------------------
// Create hardware selector
// ----------------------------------------------------------------------------

const hardwareSelector = apiSpecificRenderWindow.getSelector();
hardwareSelector.setCaptureZValues(true);
// TODO: bug in FIELD_ASSOCIATION_POINTS mode
// hardwareSelector.setFieldAssociation(
//   FieldAssociations.FIELD_ASSOCIATION_POINTS
// );
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

const updatePositionTooltip = (worldPosition) => {
  if (lastProcessedActor) {
    positionTooltipElem.innerHTML = `Position: ${worldPosition
      .map((v) => v.toFixed(3))
      .join(' , ')}`;
  } else {
    positionTooltipElem.innerHTML = '';
  }
};

const updateAssociationTooltip = (type, id) => {
  if (type !== undefined && id !== undefined) {
    fieldIdTooltipElem.innerHTML = `${type} ID: ${id}`;
  } else {
    fieldIdTooltipElem.innerHTML = '';
  }
};

const updateCompositeAndPropIdTooltip = (compositeID, propID) => {
  if (compositeID !== undefined) {
    compositeIdTooltipElem.innerHTML = `Composite ID: ${compositeID}`;
  } else {
    compositeIdTooltipElem.innerHTML = '';
  }
  if (propID !== undefined) {
    propIdTooltipElem.innerHTML = `Prop ID: ${propID}`;
  } else {
    propIdTooltipElem.innerHTML = '';
  }
};

const updateCursor = (worldPosition) => {
  if (lastProcessedActor) {
    pointerActor.setVisibility(true);
    pointerActor.setPosition(worldPosition);
  } else {
    pointerActor.setVisibility(false);
  }
  renderWindow.render();
  updatePositionTooltip(worldPosition);
};

function processSelections(selections) {
  renderer.getActors().forEach((a) => a.getProperty().setColor(...WHITE));
  if (!selections || selections.length === 0) {
    lastProcessedActor = null;
    updateAssociationTooltip();
    updateCursor();
    updateCompositeAndPropIdTooltip();
    return;
  }

  const {
    worldPosition: rayHitWorldPosition,
    compositeID,
    prop,
    propID,
    attributeID,
  } = selections[0].getProperties();

  updateCompositeAndPropIdTooltip(compositeID, propID);

  let closestCellPointWorldPosition = [...rayHitWorldPosition];
  if (attributeID || attributeID === 0) {
    const input = prop.getMapper().getInputData();
    if (!input.getCells()) {
      input.buildCells();
    }

    // Get matrices to convert coordinates: (prop coordinates) <-> (world coordinates)
    const glTempMat = mat4.fromValues(...prop.getMatrix());
    mat4.transpose(glTempMat, glTempMat);
    const propToWorld = vtkMatrixBuilder.buildFromDegree().setMatrix(glTempMat);
    mat4.invert(glTempMat, glTempMat);
    const worldToProp = vtkMatrixBuilder.buildFromDegree().setMatrix(glTempMat);
    // Compute the position of the cursor in prop coordinates
    const propPosition = [...rayHitWorldPosition];
    worldToProp.apply(propPosition);

    if (
      hardwareSelector.getFieldAssociation() ===
      FieldAssociations.FIELD_ASSOCIATION_POINTS
    ) {
      // Selecting points
      closestCellPointWorldPosition = [
        ...input.getPoints().getTuple(attributeID),
      ];
      propToWorld.apply(closestCellPointWorldPosition);
      updateAssociationTooltip('Point', attributeID);
    } else {
      // Selecting cells
      const cellPoints = input.getCellPoints(attributeID);
      updateAssociationTooltip('Cell', attributeID);
      if (cellPoints) {
        const pointIds = cellPoints.cellPointIds;
        // Find the closest cell point, and use that as cursor position
        const points = Array.from(pointIds).map((pointId) =>
          input.getPoints().getPoint(pointId)
        );
        const distance = (pA, pB) =>
          vtkMath.distance2BetweenPoints(pA, propPosition) -
          vtkMath.distance2BetweenPoints(pB, propPosition);
        const sorted = points.sort(distance);
        closestCellPointWorldPosition = [...sorted[0]];
        propToWorld.apply(closestCellPointWorldPosition);
      }
    }
  }
  lastProcessedActor = prop;
  // Use closestCellPointWorldPosition or rayHitWorldPosition
  updateCursor(closestCellPointWorldPosition);

  // Make the picked actor green
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
  renderWindow.render();
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
const throttleMouseHandler = throttle(pickOnMouseEvent, 20);

document.addEventListener('mousemove', throttleMouseHandler);
