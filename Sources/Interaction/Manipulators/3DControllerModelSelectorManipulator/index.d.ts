import vtkCompositeVRManipulator from '../CompositeVRManipulator';

export interface vtk3DControllerModelSelectorManipulator
  extends vtkCompositeVRManipulator {}

export interface I3DControllerModelSelectorManipulatorInitialValues
  extends vtkCompositeVRManipulator {}

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: I3DControllerModelSelectorManipulatorInitialValues
): void;

export const vtk3DControllerModelSelectorManipulator: {
  extend: typeof extend;
};

export default vtk3DControllerModelSelectorManipulator;
