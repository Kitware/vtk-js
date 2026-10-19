import { it, expect } from 'vitest';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkKeyboardCameraManipulator from 'vtk.js/Sources/Interaction/Manipulators/KeyboardCameraManipulator';

it('Test KeyboardCameraManipulator stops its animation on key up', () => {
  const manip = vtkKeyboardCameraManipulator.newInstance();
  const renderer = vtkRenderer.newInstance();
  const requested = [];
  const canceled = [];
  const interactor = {
    requestAnimation: (requester) => requested.push(requester),
    cancelAnimation: (requester) => canceled.push(requester),
    onAnimation: () => ({ unsubscribe: () => {} }),
    getLightFollowCamera: () => false,
  };

  manip.onKeyDown(interactor, renderer, 'w');
  expect(manip.inMotion(), 'Moving after key down').toBeTruthy();

  expect(() => manip.onKeyUp(interactor, renderer, 'w')).not.toThrow();
  expect(manip.inMotion(), 'Stopped after key up').toBeFalsy();
  expect(canceled, 'Animation request canceled').toEqual(requested);
});
