import vtkFullScreenRenderWindow     from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';

import vtkActor                      from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkConeSource                 from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkMapper                     from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkInteractorStyleManipulator from 'vtk.js/Sources/Interaction/Style/InteractorStyleManipulator';

import vtkCameraManipulator          from 'vtk.js/Sources/Interaction/Manipulators/CameraManipulator';
import vtkTrackballMultiRotate       from 'vtk.js/Sources/Interaction/Manipulators/TrackballMultiRotate';
import vtkTrackballPan               from 'vtk.js/Sources/Interaction/Manipulators/TrackballPan';
import vtkTrackballRoll              from 'vtk.js/Sources/Interaction/Manipulators/TrackballRoll';
import vtkTrackballRotate            from 'vtk.js/Sources/Interaction/Manipulators/TrackballRotate';
import vtkTrackballZoom              from 'vtk.js/Sources/Interaction/Manipulators/TrackballZoom';
import vtkTrackballZoomToMouse       from 'vtk.js/Sources/Interaction/Manipulators/TrackballZoomToMouse';

import controlPanel from './controller.html';

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
  leftButton: { button: 1, shift: false, control: false },
  middleButton: { button: 2, shift: false, control: false },
  rightButton: { button: 3, shift: false, control: false },
  shiftLeftButton: { button: 1, shift: true, control: false },
  shiftMiddleButton: { button: 2, shift: true, control: false },
  shiftRightButton: { button: 3, shift: true, control: false },
  controlLeftButton: { button: 1, shift: false, control: true },
  controlMiddleButton: { button: 2, shift: false, control: true },
  controlRightButton: { button: 3, shift: false, control: true },
};

const manipulatorFactory = {
  None: vtkCameraManipulator,
  Pan: vtkTrackballPan,
  Zoom: vtkTrackballZoom,
  Roll: vtkTrackballRoll,
  Rotate: vtkTrackballRotate,
  MultiRotate: vtkTrackballMultiRotate,
  ZoomToMouse: vtkTrackballZoomToMouse,
};

function reassignManipulators() {
  interactorStyle.removeAllManipulators();
  Object.keys(uiComponents).forEach((keyName) => {
    const manipulator = manipulatorFactory[uiComponents[keyName].manipName].newInstance();
    manipulator.setButton(selectMap[keyName].button);
    manipulator.setShift(selectMap[keyName].shift);
    manipulator.setControl(selectMap[keyName].control);
    interactorStyle.addManipulator(manipulator);
  });
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
