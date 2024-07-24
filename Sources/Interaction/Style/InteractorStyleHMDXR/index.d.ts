import vtkInteractorStyleManipulator, {
  IInteractorStyleManipulatorInitialValues,
} from '../../../Interaction/Style/InteractorStyleManipulator';

export interface vtkInteractorStyleHMDXR
  extends vtkInteractorStyleManipulator {}

export interface IInteractorStyleHMDXRInitialValues
  extends IInteractorStyleManipulatorInitialValues {}

export function newInstance(
  initialValues?: IInteractorStyleHMDXRInitialValues
): vtkInteractorStyleHMDXR;

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IInteractorStyleHMDXRInitialValues
): void;

export const vtkInteractorStyleHMDXR: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkInteractorStyleHMDXR;
