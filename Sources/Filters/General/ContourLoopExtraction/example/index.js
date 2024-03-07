import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkCutter from '@kitware/vtk.js/Filters/Core/Cutter';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import HttpDataAccessHelper from '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import DataAccessHelper from '@kitware/vtk.js/IO/Core/DataAccessHelper';
import vtkHttpSceneLoader from '@kitware/vtk.js/IO/Core/HttpSceneLoader';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkPlane from '@kitware/vtk.js/Common/DataModel/Plane';
import vtkProperty from '@kitware/vtk.js/Rendering/Core/Property';
import vtkContourLoopExtraction from '@kitware/vtk.js/Filters/General/ContourLoopExtraction';
import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData';
import vtkPoints from '@kitware/vtk.js/Common/Core/Points';
import vtkCellArray from '@kitware/vtk.js/Common/Core/CellArray';
import controlPanel from './controlPanel.html';

// Force DataAccessHelper to have access to various data source
import '@kitware/vtk.js/IO/Core/DataAccessHelper/JSZipDataAccessHelper';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------
const colors = [
  [1, 0, 0], // Red
  [0, 1, 0], // Green
  [0, 0, 1], // Blue
  [1, 1, 0], // Yellow
  [1, 0, 1], // Magenta
  [0, 1, 1], // Cyan
];

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const plane = vtkPlane.newInstance();

const cutter = vtkCutter.newInstance();
cutter.setCutFunction(plane);

const dragonMapper = vtkMapper.newInstance();
dragonMapper.setScalarVisibility(false);
const dragonActor = vtkActor.newInstance();
dragonActor.setMapper(dragonMapper);
const dragonProperty = dragonActor.getProperty();
dragonProperty.setRepresentation(vtkProperty.Representation.WIREFRAME);
dragonProperty.setLighting(false);
dragonProperty.setOpacity(0.1);
renderer.addActor(dragonActor);

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);

const state = {
  originX: 0,
  originY: 0,
  originZ: 0,
  normalX: 1,
  normalY: 0,
  normalZ: 0,
};

/**
 * Updates the plane's position and orientation based on the global state,
 * removes all actors except the first one (presumed to be the dragon actor),
 * and generates loops from the cutting operation to be displayed in the renderer.
 */
const updatePlaneAndGenerateLoops = () => {
  // Update plane based on the current state
  plane.setOrigin(state.originX, state.originY, state.originZ);
  plane.setNormal(state.normalX, state.normalY, state.normalZ);

  // Perform rendering
  renderWindow.render();

  // Process cutter output to extract contour loops
  const cutterOutput = cutter.getOutputData();
  cutterOutput.buildLinks();
  const loopExtractor = vtkContourLoopExtraction.newInstance();
  loopExtractor.setInputData(cutterOutput);

  const outputData = loopExtractor.getOutputData();
  const loops = outputData.getLines().getData();
  const points = outputData.getPoints().getData();
  const numberOfLoops = outputData.getLines().getNumberOfCells();

  // Data structures to hold the extracted loops' points
  const flatPointsAll = [];
  const pointListsAll = [];
  let index = 0;

  // Preserve the first actor (dragon) and remove any additional actors
  const actors = renderer.getActors();
  for (let i = 1; i < actors.length; i++) {
    renderer.removeActor(actors[i]);
  }

  // Extract points from each loop
  for (let i = 0; i < numberOfLoops; i++) {
    const polygonPointCount = loops[index];
    const polygonPointIndices = loops.slice(
      index + 1,
      index + 1 + polygonPointCount
    );

    const polygon = [];
    const pointList = [];
    polygonPointIndices.forEach((pointIndex) => {
      const point = [
        points[pointIndex * 3],
        points[pointIndex * 3 + 1],
        points[pointIndex * 3 + 2],
      ];
      polygon.push(...point);
      pointList.push(point);
    });

    flatPointsAll.push(polygon);
    pointListsAll.push(pointList);
    index += polygonPointCount + 1;
  }

  // Create and display loops as actors
  pointListsAll.forEach((pointList, loopIndex) => {
    const pointsData = vtkPoints.newInstance();
    const linesData = vtkCellArray.newInstance();
    const flatPoints = flatPointsAll[loopIndex];

    // Create a list of point indices to define the lines
    const pointIndexes = Float32Array.from(pointList.map((_, ind) => ind));
    const linePoints = Float32Array.from(flatPoints);

    pointsData.setData(linePoints, 3);
    linesData.insertNextCell(Array.from(pointIndexes));

    // Construct polygon from points and lines
    const polygon = vtkPolyData.newInstance();
    polygon.setPoints(pointsData);
    polygon.setLines(linesData);

    // Create actor for the loop
    const actor = vtkActor.newInstance();
    const color = colors[loopIndex % colors.length];
    actor.getProperty().setColor(...color);
    actor.getProperty().setLineWidth(5); // Set line thickness

    const mapper = vtkMapper.newInstance();
    mapper.setInputData(polygon);
    actor.setMapper(mapper);
    renderer.addActor(actor);
  });

  // Render the updated scene
  renderWindow.render();
};

// Update when changing UI
['originX', 'originY', 'originZ', 'normalX', 'normalY', 'normalZ'].forEach(
  (propertyName) => {
    const elem = document.querySelector(`.${propertyName}`);
    elem.addEventListener('input', (e) => {
      const value = Number(e.target.value);
      state[propertyName] = value;
      updatePlaneAndGenerateLoops();
    });
  }
);

HttpDataAccessHelper.fetchBinary(
  `${__BASE_PATH__}/data/StanfordDragon.vtkjs`,
  {}
).then((zipContent) => {
  const dataAccessHelper = DataAccessHelper.get('zip', {
    zipContent,
    callback: (zip) => {
      const sceneImporter = vtkHttpSceneLoader.newInstance({
        renderer,
        dataAccessHelper,
      });
      sceneImporter.setUrl('index.json');
      sceneImporter.onReady(() => {
        sceneImporter.getScene()[0].actor.setVisibility(false);

        const source = sceneImporter.getScene()[0].source;
        cutter.setInputConnection(source.getOutputPort());
        dragonMapper.setInputConnection(source.getOutputPort());
        renderer.resetCamera();
        updatePlaneAndGenerateLoops();
      });
    },
  });
});
