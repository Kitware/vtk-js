import { States } from '../../../Rendering/Core/InteractorStyle/Constants';
import vtkRenderer from '../../../Rendering/Core/Renderer';
import vtkInteractorObserver from '../../../Rendering/Core/InteractorObserver';
import {
  Device,
  Input,
} from '../../../Rendering/Core/RenderWindowInteractor/Constants';
import {
  I3DEvent,
  IButton3DEvent,
} from '../../../Rendering/Core/RenderWindowInteractor';

export interface vtkCompositeVRManipulator {
  onButton3D(
    interactorStyle: vtkInteractorObserver,
    renderer: vtkRenderer,
    state: States,
    eventData: IButton3DEvent
  ): void;

  onMove3D(
    interactorStyle: vtkInteractorObserver,
    renderer: vtkRenderer,
    state: States,
    eventData: I3DEvent
  ): void;
}

export interface ICompositeVRManipulatorInitialValues {
  device?: Device;
  input?: Input;
}

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ICompositeVRManipulatorInitialValues
): void;

export const vtkCompositeVRManipulator: {
  extend: typeof extend;
};

export default vtkCompositeVRManipulator;
