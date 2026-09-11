import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkCubeSource from '@kitware/vtk.js/Filters/Sources/CubeSource';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkInteractorStyleTrackballActor from '@kitware/vtk.js/Interaction/Style/InteractorStyleTrackballActor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';

import GUI from 'lil-gui';

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
const interactor = fullScreenRenderer.getInteractor();

const cubeSource = vtkCubeSource.newInstance({
  xLength: 1.2,
  yLength: 0.8,
  zLength: 0.6,
});
const mapper = vtkMapper.newInstance();
mapper.setInputConnection(cubeSource.getOutputPort());

const actor = vtkActor.newInstance();
actor.setMapper(mapper);
renderer.addActor(actor);

renderer.resetCamera();
renderWindow.render();

interactor.setInteractorStyle(vtkInteractorStyleTrackballActor.newInstance());
const style = interactor.getInteractorStyle();
const gui = new GUI();
const params = {
  motionFactor: style.getMotionFactor(),
  left: 'rotate picked actor',
  shiftLeft: 'pan picked actor',
  ctrlLeft: 'spin picked actor',
  middle: 'pan picked actor',
  ctrlMiddle: 'dolly picked actor',
  right: 'uniform scale picked actor',
};

gui.add(params, 'motionFactor', 1, 30, 1).onChange((value) => {
  style.setMotionFactor(Number(value));
  renderWindow.render();
});
gui.add(params, 'left').name('Left').disable();
gui.add(params, 'shiftLeft').name('Shift + Left').disable();
gui.add(params, 'ctrlLeft').name('Ctrl + Left').disable();
gui.add(params, 'middle').name('Middle').disable();
gui.add(params, 'ctrlMiddle').name('Ctrl + Middle').disable();
gui.add(params, 'right').name('Right').disable();
