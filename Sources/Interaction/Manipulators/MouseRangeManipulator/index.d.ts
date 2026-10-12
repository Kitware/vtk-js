import vtkCompositeMouseManipulator, {
  ICompositeMouseManipulatorInitialValues,
} from '../../../Interaction/Manipulators/CompositeMouseManipulator';
import vtkRenderer from '../../../Rendering/Core/Renderer';
import vtkRenderWindowInteractor from '../../../Rendering/Core/RenderWindowInteractor';
import { vtkObject } from '../../../interfaces';

export interface IMouseRangeManipulatorInitialValues extends ICompositeMouseManipulatorInitialValues {
  usePointerLock?: boolean;
}

export interface vtkMouseRangeManipulator
  extends vtkCompositeMouseManipulator, vtkObject {
  setHorizontalListener(
    min: number,
    max: number,
    step: number,
    getValue: number | (() => number),
    setValue: (v: number) => void,
    scale?: number,
    exponentialScroll?: boolean
  );
  setVerticalListener(
    min: number,
    max: number,
    step: number,
    getValue: number | (() => number),
    setValue: (v: number) => void,
    scale?: number,
    exponentialScroll?: boolean
  );
  setScrollListener(
    min: number,
    max: number,
    step: number,
    getValue: number | (() => number),
    setValue: (v: number) => void,
    scale?: number,
    exponentialScroll?: boolean
  );
  removeHorizontalListener();
  removeVerticalListener();
  removeScrollListener();
  removeAllListeners();

  /**
   * Starts listening to mouse move events while the pointer is locked.
   * @param interactor the interactor
   * @param renderer the renderer
   */
  startPointerLockEvent(
    interactor: vtkRenderWindowInteractor,
    renderer: vtkRenderer
  ): void;

  /**
   * Handles a mouse move event while the pointer is locked.
   * @param interactor the interactor
   * @param renderer the renderer
   * @param event the mouse event
   */
  onPointerLockMove(
    interactor: vtkRenderWindowInteractor,
    renderer: vtkRenderer,
    event: MouseEvent
  ): void;

  /**
   *
   */
  getUsePointerLock(): boolean | undefined;

  /**
   *
   */
  setUsePointerLock(usePointerLock: boolean): boolean;
}

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IMouseRangeManipulatorInitialValues
): void;
export function newInstance(
  initialValues?: IMouseRangeManipulatorInitialValues
): vtkMouseRangeManipulator;

export declare const vtkMouseRangeManipulator: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkMouseRangeManipulator;
