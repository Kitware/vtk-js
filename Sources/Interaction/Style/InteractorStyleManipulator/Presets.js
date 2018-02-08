import Manipulators from 'vtk.js/Sources/Interaction/Manipulators';

const MANIPULTOR_TYPES = {
  slice: Manipulators.vtkMouseCameraSliceManipulator,
  multiRotate: Manipulators.vtkMouseCameraTrackballMultiRotateManipulator,
  pan: Manipulators.vtkMouseCameraTrackballPanManipulator,
  roll: Manipulators.vtkMouseCameraTrackballRollManipulator,
  rotate: Manipulators.vtkMouseCameraTrackballRotateManipulator,
  zoom: Manipulators.vtkMouseCameraTrackballZoomManipulator,
  zoomToMouse: Manipulators.vtkMouseCameraTrackballZoomToMouseManipulator,
  range: Manipulators.vtkMouseRangeManipulator,
  vrPan: Manipulators.vtkVRButtonPanManipulator,
};

const STYLES = {
  '3D': [
    { type: 'rotate' },
    { type: 'pan', options: { shift: true } },
    { type: 'zoom', options: { control: true } },
    { type: 'zoom', options: { alt: true } },
    { type: 'zoom', options: { dragEnabled: false, scrollEnabled: true } },
    { type: 'zoom', options: { button: 3 } },
    { type: 'vrPan' },
  ],
  '2D': [
    { type: 'pan' },
    { type: 'roll', options: { shift: true } },
    { type: 'zoom', options: { control: true } },
    { type: 'zoom', options: { alt: true } },
    { type: 'zoom', options: { dragEnabled: false, scrollEnabled: true } },
    { type: 'vrPan' },
  ],
};

function applyDefinitions(definitions, manipulatorStyle) {
  manipulatorStyle.removeAllMouseManipulators();
  manipulatorStyle.removeAllVRManipulators();
  for (let idx = 0; idx < definitions.length; idx++) {
    const definition = definitions[idx];
    const instance = MANIPULTOR_TYPES[definition.type].newInstance(
      definition.options
    );
    if (instance.isA('vtkCompositeVRManipulator')) {
      manipulatorStyle.addVRManipulator(instance);
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
