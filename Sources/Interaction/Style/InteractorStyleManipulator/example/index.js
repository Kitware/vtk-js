/* eslint-disable no-nested-ternary */
import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkInteractorStyleManipulator from '@kitware/vtk.js/Interaction/Style/InteractorStyleManipulator';

import vtkMouseCameraTrackballMultiRotateManipulator from '@kitware/vtk.js/Interaction/Manipulators/MouseCameraTrackballMultiRotateManipulator';
import vtkMouseCameraTrackballPanManipulator from '@kitware/vtk.js/Interaction/Manipulators/MouseCameraTrackballPanManipulator';
import vtkMouseCameraTrackballRollManipulator from '@kitware/vtk.js/Interaction/Manipulators/MouseCameraTrackballRollManipulator';
import vtkMouseCameraTrackballRotateManipulator from '@kitware/vtk.js/Interaction/Manipulators/MouseCameraTrackballRotateManipulator';
import vtkMouseCameraTrackballZoomManipulator from '@kitware/vtk.js/Interaction/Manipulators/MouseCameraTrackballZoomManipulator';
import vtkMouseCameraTrackballZoomToMouseManipulator from '@kitware/vtk.js/Interaction/Manipulators/MouseCameraTrackballZoomToMouseManipulator';

import vtkGestureCameraManipulator from '@kitware/vtk.js/Interaction/Manipulators/GestureCameraManipulator';

import GUI from 'lil-gui';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const interactorStyle = vtkInteractorStyleManipulator.newInstance();
fullScreenRenderer.getInteractor().setInteractorStyle(interactorStyle);

// ----------------------------------------------------------------------------
// Source, actor and mapper
// ----------------------------------------------------------------------------

const coneSource = vtkConeSource.newInstance({ height: 1.0 });
const mapper = vtkMapper.newInstance();
mapper.setInputConnection(coneSource.getOutputPort());

const actor = vtkActor.newInstance();
actor.setMapper(mapper);

renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

const uiComponents = {};
const selectMap = {
  leftButton: { button: 1 },
  middleButton: { button: 2 },
  rightButton: { button: 3 },
  scrollMiddleButton: { scrollEnabled: true, dragEnabled: false },
  shiftLeftButton: { button: 1, shift: true },
  shiftMiddleButton: { button: 2, shift: true },
  shiftRightButton: { button: 3, shift: true },
  shiftScrollMiddleButton: {
    scrollEnabled: true,
    dragEnabled: false,
    shift: true,
  },
  controlLeftButton: { button: 1, control: true },
  controlMiddleButton: { button: 2, control: true },
  controlRightButton: { button: 3, control: true },
  controlScrollMiddleButton: {
    scrollEnabled: true,
    dragEnabled: false,
    control: true,
  },
  altLeftButton: { button: 1, alt: true },
  altMiddleButton: { button: 2, alt: true },
  altRightButton: { button: 3, alt: true },
  altScrollMiddleButton: { scrollEnabled: true, dragEnabled: false, alt: true },
};

const manipulatorFactory = {
  None: null,
  Pan: vtkMouseCameraTrackballPanManipulator,
  Zoom: vtkMouseCameraTrackballZoomManipulator,
  Roll: vtkMouseCameraTrackballRollManipulator,
  Rotate: vtkMouseCameraTrackballRotateManipulator,
  MultiRotate: vtkMouseCameraTrackballMultiRotateManipulator,
  ZoomToMouse: vtkMouseCameraTrackballZoomToMouseManipulator,
};

const manipulatorOptions = Object.keys(manipulatorFactory);
const scrollManipulatorOptions = ['Zoom', 'ZoomToMouse'];

function reassignManipulators() {
  interactorStyle.removeAllMouseManipulators();
  Object.keys(uiComponents).forEach((keyName) => {
    const klass = manipulatorFactory[uiComponents[keyName].manipName];
    if (klass) {
      const manipulator = klass.newInstance();
      manipulator.setButton(selectMap[keyName].button);
      manipulator.setShift(!!selectMap[keyName].shift);
      manipulator.setControl(!!selectMap[keyName].control);
      manipulator.setAlt(!!selectMap[keyName].alt);
      if (selectMap[keyName].scrollEnabled !== undefined) {
        manipulator.setScrollEnabled(selectMap[keyName].scrollEnabled);
      }
      if (selectMap[keyName].dragEnabled !== undefined) {
        manipulator.setDragEnabled(selectMap[keyName].dragEnabled);
      }
      interactorStyle.addMouseManipulator(manipulator);
    }
  });

  interactorStyle.addGestureManipulator(
    vtkGestureCameraManipulator.newInstance()
  );
}

const gui = new GUI({ title: 'Modifier Key' });

const noneFolder = gui.addFolder('None');
const shiftFolder = gui.addFolder('Shift +');
const ctrlFolder = gui.addFolder('Ctrl +');
const altFolder = gui.addFolder('Alt +');

// None
['leftButton', 'middleButton', 'rightButton'].forEach((name) => {
  const defaultValue =
    name === 'leftButton'
      ? 'Rotate'
      : name === 'middleButton'
      ? 'Pan'
      : name === 'rightButton'
      ? 'Zoom'
      : 'None';
  uiComponents[name] = { manipName: defaultValue };
  noneFolder
    .add(uiComponents[name], 'manipName', manipulatorOptions)
    .name(name)
    .onChange(reassignManipulators);
});
uiComponents.scrollMiddleButton = { manipName: 'Zoom' };
noneFolder
  .add(uiComponents.scrollMiddleButton, 'manipName', scrollManipulatorOptions)
  .name('scrollMiddleButton')
  .onChange(reassignManipulators);

// Shift +
['shiftLeftButton', 'shiftMiddleButton', 'shiftRightButton'].forEach(
  (name, i) => {
    // Roll, Rotate, Pan, None
    const defaults = ['Roll', 'Rotate', 'Pan'];
    const defaultValue = defaults[i] || 'None';
    uiComponents[name] = { manipName: defaultValue };
    shiftFolder
      .add(uiComponents[name], 'manipName', manipulatorOptions)
      .name(name.replace('shift', '').replace(/^./, (c) => c.toLowerCase()))
      .onChange(reassignManipulators);
  }
);
uiComponents.shiftScrollMiddleButton = { manipName: 'None' };
shiftFolder
  .add(
    uiComponents.shiftScrollMiddleButton,
    'manipName',
    scrollManipulatorOptions
  )
  .name('scrollMiddleButton')
  .onChange(reassignManipulators);

// Ctrl +
['controlLeftButton', 'controlMiddleButton', 'controlRightButton'].forEach(
  (name, i) => {
    // Zoom, Rotate, ZoomToMouse, None
    const defaults = ['Zoom', 'Rotate', 'ZoomToMouse'];
    const defaultValue = defaults[i] || 'None';
    uiComponents[name] = { manipName: defaultValue };
    ctrlFolder
      .add(uiComponents[name], 'manipName', manipulatorOptions)
      .name(name.replace('control', '').replace(/^./, (c) => c.toLowerCase()))
      .onChange(reassignManipulators);
  }
);
uiComponents.controlScrollMiddleButton = { manipName: 'None' };
ctrlFolder
  .add(
    uiComponents.controlScrollMiddleButton,
    'manipName',
    scrollManipulatorOptions
  )
  .name('scrollMiddleButton')
  .onChange(reassignManipulators);

// Alt +
['altLeftButton', 'altMiddleButton', 'altRightButton'].forEach((name, i) => {
  // Zoom, Rotate, ZoomToMouse, None
  const defaults = ['Zoom', 'Rotate', 'ZoomToMouse'];
  const defaultValue = defaults[i] || 'None';
  uiComponents[name] = { manipName: defaultValue };
  altFolder
    .add(uiComponents[name], 'manipName', manipulatorOptions)
    .name(name.replace('alt', '').replace(/^./, (c) => c.toLowerCase()))
    .onChange(reassignManipulators);
});
uiComponents.altScrollMiddleButton = { manipName: 'None' };
altFolder
  .add(
    uiComponents.altScrollMiddleButton,
    'manipName',
    scrollManipulatorOptions
  )
  .name('scrollMiddleButton')
  .onChange(reassignManipulators);

noneFolder.open();
shiftFolder.open();
ctrlFolder.open();
altFolder.open();

// Populate with initial manipulators
reassignManipulators();

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.source = coneSource;
global.mapper = mapper;
global.actor = actor;
global.renderer = renderer;
global.renderWindow = renderWindow;
