import { States } from '../../../Rendering/Core/InteractorStyle/Constants';
import vtkRenderer from '../../../Rendering/Core/Renderer';
import vtkRenderWindowInteractor from '../../../Rendering/Core/RenderWindowInteractor';
import {
  Device,
  Input,
} from '../../../Rendering/Core/RenderWindowInteractor/Constants';

export interface vtkCompositeVRManipulator {
  onButton3D(
    interactor: vtkRenderWindowInteractor,
    renderer: vtkRenderer,
    state: States,
    device: Device,
    input: Input,
    pressed: boolean
  ): void;

  onMove3D(
    interactor: vtkRenderWindowInteractor,
    renderer: vtkRenderer,
    state: States,
    device: Device,
    input: Input,
    pressed: boolean
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
