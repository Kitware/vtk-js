import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkTriangleFilter from '@kitware/vtk.js/Filters/General/TriangleFilter';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';

import vtk2DShape from '@kitware/vtk.js/Filters/Sources/Arrow2DSource/';

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

const initialValues = { shape: 'star' }; // choices include triangle, star, arrow4points, arrow6points
const shapeSource = vtk2DShape.newInstance(initialValues);
const triangleFilter = vtkTriangleFilter.newInstance();
const mapper = vtkMapper.newInstance();
const actor = vtkActor.newInstance();

triangleFilter.setInputConnection(shapeSource.getOutputPort());
mapper.setInputConnection(triangleFilter.getOutputPort());
actor.setMapper(mapper);

renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();
