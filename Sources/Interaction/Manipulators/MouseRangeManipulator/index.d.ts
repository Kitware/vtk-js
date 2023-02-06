import vtkCompositeMouseManipulator, {
  ICompositeMouseManipulatorInitialValues,
} from '../../../Interaction/Manipulators/CompositeMouseManipulator';

export interface IMouseRangeManipulatorInitialValues
  extends ICompositeMouseManipulatorInitialValues {}

export interface vtkMouseRangeManipulator extends vtkCompositeMouseManipulator {
  setHorizontalListener(
    min: number,
    max: number,
    step: number,
    getValue: () => number,
    setValue: (v: number) => void,
    scale?: number
  );
  setVerticalListener(
    min: number,
    max: number,
    step: number,
    getValue: () => number,
    setValue: (v: number) => void,
    scale?: number
  );
  setScrollListener(
    min: number,
    max: number,
    step: number,
    getValue: () => number,
    setValue: (v: number) => void,
    scale?: number
  );
  removeHorizontalListener();
  removeVerticalListener();
  removeScrollListener();
  removeAllListeners();
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
