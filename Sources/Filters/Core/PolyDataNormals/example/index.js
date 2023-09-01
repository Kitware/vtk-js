import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkLineSource from 'vtk.js/Sources/Filters/Sources/LineSource';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';

import vtkPolyDataNormals from 'vtk.js/Sources/Filters/Core/PolyDataNormals';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

const computeNormals = vtkPolyDataNormals.newInstance();

const sphere = vtkSphereSource.newInstance({
  thetaResolution: 4,
  phiResolution: 4,
});
const polydata = sphere.getOutputData();

const mapper = vtkMapper.newInstance();
const actor = vtkActor.newInstance();

actor.setMapper(mapper);
mapper.setInputData(polydata);

renderer.addActor(actor);

computeNormals.setInputData(polydata);
computeNormals.setComputeCellNormals(true);
computeNormals.update();

const cellNormals = computeNormals.getOutputData().getCellData().getNormals();

const pointsData = polydata.getPoints().getData();
const polysData = polydata.getPolys().getData();

let numberOfPoints = 0;
const cellPointIds = [0, 0, 0];
let normalId = 0;

for (let c = 0; c < polysData.length; c += numberOfPoints + 1) {
  numberOfPoints = polysData[c];

  if (numberOfPoints < 3) {
        continue; // eslint-disable-line
  }

  for (let i = 1; i <= 3; ++i) {
    cellPointIds[i - 1] = 3 * polysData[c + i];
  }

  const v1 = pointsData.slice(cellPointIds[0], cellPointIds[0] + 3);
  const v2 = pointsData.slice(cellPointIds[1], cellPointIds[1] + 3);
  const v3 = pointsData.slice(cellPointIds[2], cellPointIds[2] + 3);

  const center = [
    (v1[0] + v2[0] + v3[0]) / 3,
    (v1[1] + v2[1] + v3[1]) / 3,
    (v1[2] + v2[2] + v3[2]) / 3,
  ];

  const line = vtkLineSource.newInstance({
    point1: center,
    point2: [
      center[0] + cellNormals[normalId++],
      center[1] + cellNormals[normalId++],
      center[2] + cellNormals[normalId++],
    ],
  });

  const lineMapper = vtkMapper.newInstance();
  const lineActor = vtkActor.newInstance();

  lineActor.setMapper(lineMapper);
  lineMapper.setInputData(line.getOutputData());
  renderer.addActor(lineActor);
}

// Display the resulting STL
renderer.resetCamera();
renderWindow.render();

global.renderer = renderer;
global.renderWindow = renderWindow;
