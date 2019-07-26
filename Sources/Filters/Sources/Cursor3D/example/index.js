import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkCursor3D from 'vtk.js/Sources/Filters/Sources/Cursor3D';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

import controlPanel from './controlPanel.html';

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
const cursor3D = vtkCursor3D.newInstance();
cursor3D.setFocalPoint([0, 0, 0]);
cursor3D.setModelBounds([-10, 10, -10, 10, -10, 10]);
const cursor3DMapper = vtkMapper.newInstance();
cursor3DMapper.setInputConnection(cursor3D.getOutputPort());
const cursor3DActor = vtkActor.newInstance();
cursor3DActor.setMapper(cursor3DMapper);

const sphereSource = vtkSphereSource.newInstance();
const sphererMapper = vtkMapper.newInstance();
sphererMapper.setInputConnection(sphereSource.getOutputPort());
const sphereActor = vtkActor.newInstance();
sphereActor.setMapper(sphererMapper);

renderer.addActor(cursor3DActor);
renderer.addActor(sphereActor);
renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);
const focalPointRanges = ['focalPointX', 'focalPointY', 'focalPointZ'].map(
  (id) => document.getElementById(id)
);
const handleFocalPointInput = (e) => {
  cursor3D.setFocalPoint([
    focalPointRanges[0].value,
    focalPointRanges[1].value,
    focalPointRanges[2].value,
  ]);
  renderer.resetCameraClippingRange();
  renderWindow.render();
};
focalPointRanges.forEach((input) =>
  input.addEventListener('input', handleFocalPointInput)
);
const modelBoundsRanges = [
  'modelBoundsXMin',
  'modelBoundsXMax',
  'modelBoundsYMin',
  'modelBoundsYMax',
  'modelBoundsZMin',
  'modelBoundsZMax',
].map((id) => document.getElementById(id));
const handleModelBoundsInput = (e) => {
  cursor3D.setModelBounds([
    modelBoundsRanges[0].value,
    modelBoundsRanges[1].value,
    modelBoundsRanges[2].value,
    modelBoundsRanges[3].value,
    modelBoundsRanges[4].value,
    modelBoundsRanges[5].value,
  ]);
  renderer.resetCameraClippingRange();
  renderWindow.render();
};
modelBoundsRanges.forEach((input) =>
  input.addEventListener('input', handleModelBoundsInput)
);
const checkBoxes = [
  'outline',
  'axes',
  'xShadows',
  'yShadows',
  'zShadows',
  'wrap',
  'translationMode',
].map((id) => document.getElementById(id));
const handleCheckBoxInput = (e) => {
  cursor3D.set({ [e.target.id]: e.target.checked });
  renderer.resetCameraClippingRange();
  renderWindow.render();
};
checkBoxes.forEach((checkBox) =>
  checkBox.addEventListener('input', handleCheckBoxInput)
);
