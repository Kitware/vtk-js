import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkTriangleFilter from 'vtk.js/Sources/Filters/General/TriangleFilter';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

import vtk2DShape from 'vtk.js/Sources/Filters/Sources/Arrow2DSource/';

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
