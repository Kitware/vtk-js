import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkPoints from '@kitware/vtk.js/Common/Core/Points';
import vtkCellArray from '@kitware/vtk.js/Common/Core/CellArray';
import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData';
import vtkTriangleStrip from '@kitware/vtk.js/Common/DataModel/TriangleStrip';

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

const points = vtkPoints.newInstance();
points.setNumberOfPoints(4);
points.setData(
  Float32Array.from([
    0,
    0,
    0, // Point 0
    0,
    1,
    0, // Point 1
    1,
    0,
    0, // Point 2
    1.5,
    1,
    0, // Point 3
  ])
);
const pointIdList = [0, 1, 2, 3];
const triangleStrip = vtkTriangleStrip.newInstance();
triangleStrip.initialize(points, pointIdList);

const cells = vtkCellArray.newInstance();
cells.insertNextCell(triangleStrip);

const polyData = vtkPolyData.newInstance();
polyData.setPoints(points);
polyData.setStrips(cells);

const mapper = vtkMapper.newInstance();
mapper.setInputData(polyData);
const actor = vtkActor.newInstance();
actor.getProperty().setRepresentationToWireframe();
actor.setMapper(mapper);
renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();
