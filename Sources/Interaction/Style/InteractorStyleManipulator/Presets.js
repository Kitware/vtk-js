import Manipulators from 'vtk.js/Sources/Interaction/Manipulators';

const MANIPULTOR_TYPES = {
  slice: Manipulators.vtkMouseCameraSliceManipulator,
  multiRotate: Manipulators.vtkMouseCameraTrackballMultiRotateManipulator,
  pan: Manipulators.vtkMouseCameraTrackballPanManipulator,
  roll: Manipulators.vtkMouseCameraTrackballRollManipulator,
  rotate: Manipulators.vtkMouseCameraTrackballRotateManipulator,
  axisRotate: Manipulators.vtkMouseCameraAxisRotateManipulator,
  zoom: Manipulators.vtkMouseCameraTrackballZoomManipulator,
  zoomToMouse: Manipulators.vtkMouseCameraTrackballZoomToMouseManipulator,
  range: Manipulators.vtkMouseRangeManipulator,
  vrPan: Manipulators.vtkVRButtonPanManipulator,
  gestureCamera: Manipulators.vtkGestureCameraManipulator,
  movement: Manipulators.vtkKeyboardCameraManipulator,
  freeLook: Manipulators.vtkMouseCameraTrackballFirstPersonManipulator,
  unicam: Manipulators.vtkMouseCameraUnicamManipulator,
  unicamRotate: Manipulators.vtkMouseCameraUnicamRotateManipulator,
};

const STYLES = {
  '3D': [
    { type: 'rotate' },
    { type: 'pan', options: { shift: true } },
    { type: 'zoom', options: { control: true } },
    { type: 'zoom', options: { alt: true } },
    { type: 'zoom', options: { dragEnabled: false, scrollEnabled: true } },
    { type: 'zoom', options: { button: 3 } },
    { type: 'roll', options: { shift: true, control: true } },
    { type: 'roll', options: { shift: true, alt: true } },
    { type: 'roll', options: { shift: true, button: 3 } },
    { type: 'vrPan' },
    { type: 'gestureCamera' },
  ],
  '2D': [
    { type: 'pan', options: { shift: true } },
    { type: 'zoom', options: { control: true } },
    { type: 'zoom', options: { alt: true } },
    { type: 'zoom', options: { button: 3 } },
    { type: 'roll', options: { shift: true, alt: true } },
    { type: 'roll', options: { shift: true, button: 3 } },
    { type: 'roll', options: { shift: true } },
    { type: 'vrPan' },
    { type: 'gestureCamera' },
  ],
  FirstPerson: [{ type: 'movement' }, { type: 'freeLook' }],
  Unicam: [{ type: 'unicam' }],
  zRotateTop: [
    { type: 'pan', options: { shift: true } },
    {
      type: 'axisRotate',
      options: { rotationAxis: [0, 0, 1], useHalfAxis: true },
    },
    { type: 'zoom', options: { control: true } },
    { type: 'zoom', options: { alt: true } },
    { type: 'zoom', options: { dragEnabled: false, scrollEnabled: true } },
    { type: 'zoom', options: { button: 3 } },
  ],
  zRotateAll: [
    { type: 'pan', options: { shift: true } },
    {
      type: 'axisRotate',
      options: { rotationAxis: [0, 0, 1], useHalfAxis: false },
    },
    { type: 'zoom', options: { control: true } },
    { type: 'zoom', options: { alt: true } },
    { type: 'zoom', options: { dragEnabled: false, scrollEnabled: true } },
    { type: 'zoom', options: { button: 3 } },
  ],
};

function applyDefinitions(definitions, manipulatorStyle) {
  manipulatorStyle.removeAllManipulators();
  for (let idx = 0; idx < definitions.length; idx++) {
    const definition = definitions[idx];
    const instance = MANIPULTOR_TYPES[definition.type].newInstance(
      definition.options
    );
    if (instance.isA('vtkCompositeVRManipulator')) {
      manipulatorStyle.addVRManipulator(instance);
    } else if (instance.isA('vtkCompositeGestureManipulator')) {
      manipulatorStyle.addGestureManipulator(instance);
    } else if (instance.isA('vtkCompositeKeyboardManipulator')) {
      manipulatorStyle.addKeyboardManipulator(instance);
    } else {
      manipulatorStyle.addMouseManipulator(instance);
    }
  }

  return true;
}

function applyPreset(name, manipulatorStyle) {
  return applyDefinitions(STYLES[name], manipulatorStyle);
}

function registerManipulatorType(type, classDef) {
  MANIPULTOR_TYPES[type] = classDef;
}

function registerStylePreset(name, definitions) {
  STYLES[name] = definitions;
}

export default {
  applyDefinitions,
  applyPreset,
  registerManipulatorType,
  registerStylePreset,
};
