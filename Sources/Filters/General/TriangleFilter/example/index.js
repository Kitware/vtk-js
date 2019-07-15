import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkTrianleFilter from 'vtk.js/Sources/Filters/General/TriangleFilter';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

import vtkStar from './star';

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

const starSource = vtkStar.newInstance();
const triangleFilter = vtkTrianleFilter.newInstance();
const mapper = vtkMapper.newInstance();
const actor = vtkActor.newInstance();

triangleFilter.setInputConnection(starSource.getOutputPort());
mapper.setInputConnection(triangleFilter.getOutputPort());
actor.setMapper(mapper);

renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();
