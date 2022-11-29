import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import macro from '@kitware/vtk.js/macros';
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

import controlPanel from './controller.html';

const { vtkDebugMacro } = macro;

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

fullScreenRenderer.addController(controlPanel);

const uiComponents = {};
const selectMap = {
  leftButton: { button: 1 },
  middleButton: { button: 2 },
  rightButton: { button: 3 },
  shiftLeftButton: { button: 1, shift: true },
  shiftMiddleButton: { button: 2, shift: true },
  shiftRightButton: { button: 3, shift: true },
  controlLeftButton: { button: 1, control: true },
  controlMiddleButton: { button: 2, control: true },
  controlRightButton: { button: 3, control: true },
  altLeftButton: { button: 1, alt: true },
  altMiddleButton: { button: 2, alt: true },
  altRightButton: { button: 3, alt: true },
  scrollMiddleButton: { scrollEnabled: true, dragEnabled: false },
  shiftScrollMiddleButton: {
    scrollEnabled: true,
    dragEnabled: false,
    shift: true,
  },
  controlScrollMiddleButton: {
    scrollEnabled: true,
    dragEnabled: false,
    control: true,
  },
  altScrollMiddleButton: {
    scrollEnabled: true,
    dragEnabled: false,
    alt: true,
  },
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

  // Always add gesture
  interactorStyle.addGestureManipulator(
    vtkGestureCameraManipulator.newInstance()
  );
}

Object.keys(selectMap).forEach((name) => {
  const elt = document.querySelector(`.${name}`);
  elt.addEventListener('change', (e) => {
    vtkDebugMacro(`Changing action of ${name} to ${e.target.value}`);
    uiComponents[name].manipName = e.target.value;
    reassignManipulators();
  });
  uiComponents[name] = {
    elt,
    manipName: elt.value,
  };
});

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
