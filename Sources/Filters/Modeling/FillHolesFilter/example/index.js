import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkFillHolesFilter from '@kitware/vtk.js/Filters/Modeling/FillHolesFilter';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkRenderer from '@kitware/vtk.js/Rendering/Core/Renderer';
import vtkSTLReader from '@kitware/vtk.js/IO/Geometry/STLReader';

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const leftRenderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
const rightRenderer = vtkRenderer.newInstance();
renderWindow.addRenderer(rightRenderer);
leftRenderer.setViewport(0, 0, 0.5, 1);
rightRenderer.setViewport(0.5, 0, 1, 1);
leftRenderer.setBackground(0.32, 0.34, 0.43);
rightRenderer.setBackground(0.32, 0.34, 0.43);

const reader = vtkSTLReader.newInstance({
  removeDuplicateVertices: true,
  merging: true,
});
const fillHolesFilter = vtkFillHolesFilter.newInstance();
fillHolesFilter.setHoleSize(1000.0);
fillHolesFilter.setInputConnection(reader.getOutputPort());

const readerActor = vtkActor.newInstance();
const readerMapper = vtkMapper.newInstance({ scalarVisibility: false });
readerActor.setMapper(readerMapper);
readerMapper.setInputConnection(reader.getOutputPort());
leftRenderer.addActor(readerActor);

const filledActor = vtkActor.newInstance();
const filledMapper = vtkMapper.newInstance({ scalarVisibility: false });
filledActor.setMapper(filledMapper);
filledMapper.setInputConnection(fillHolesFilter.getOutputPort());
rightRenderer.addActor(filledActor);

reader.setUrl(`${__BASE_PATH__}/data/stl/spherewithholes.stl`).then(() => {
  leftRenderer.resetCamera();
  rightRenderer.setActiveCamera(leftRenderer.getActiveCamera());
  rightRenderer.resetCamera();
  renderWindow.render();
});

leftRenderer.resetCamera();
rightRenderer.setActiveCamera(leftRenderer.getActiveCamera());
renderWindow.render();
