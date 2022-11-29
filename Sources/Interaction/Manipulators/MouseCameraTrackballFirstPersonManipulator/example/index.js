import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkElevationReader from '@kitware/vtk.js/IO/Misc/ElevationReader';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkInteractorStyleManipulator from '@kitware/vtk.js/Interaction/Style/InteractorStyleManipulator';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkTexture from '@kitware/vtk.js/Rendering/Core/Texture';

import Manipulators from '@kitware/vtk.js/Interaction/Manipulators';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const reader = vtkElevationReader.newInstance({
  xSpacing: 0.01568,
  ySpacing: 0.01568,
  zScaling: 0.06666,
});
const mapper = vtkMapper.newInstance();
const actor = vtkActor.newInstance();

mapper.setInputConnection(reader.getOutputPort());
actor.setMapper(mapper);

// Download and apply Texture
const img = new Image();
img.onload = function textureLoaded() {
  const texture = vtkTexture.newInstance();
  texture.setInterpolate(true);
  texture.setImage(img);
  actor.addTexture(texture);
  renderWindow.render();
};
img.src = `${__BASE_PATH__}/data/elevation/dem.jpg`;

// The default camera is just a nice starting point...
const defaultFocalPoint = [
  1.9991999864578247, -2.007040023803711, 0.15954573452472687,
];

const defaultPosition = [
  4.109420299530029, -3.632676601409912, 0.3706766664981842,
];

const defaultViewUp = [0, 0, 1];

const camera = renderer.getActiveCamera();

// Download elevation and render when ready
reader.setUrl(`${__BASE_PATH__}/data/elevation/dem.csv`).then(() => {
  camera.setFocalPoint(...defaultFocalPoint);
  camera.setPosition(...defaultPosition);
  camera.setViewUp(...defaultViewUp);

  renderer.resetCameraClippingRange();
  renderWindow.render();
});

const keyboardManipulator =
  Manipulators.vtkKeyboardCameraManipulator.newInstance({
    movementSpeed: 0.02,
  });
const mouseManipulator =
  Manipulators.vtkMouseCameraTrackballFirstPersonManipulator.newInstance();

const iStyle = vtkInteractorStyleManipulator.newInstance();
iStyle.addKeyboardManipulator(keyboardManipulator);
iStyle.addMouseManipulator(mouseManipulator);
renderWindow.getInteractor().setInteractorStyle(iStyle);

renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.actor = actor;
global.camera = camera;
global.mapper = mapper;
global.renderer = renderer;
global.renderWindow = renderWindow;
