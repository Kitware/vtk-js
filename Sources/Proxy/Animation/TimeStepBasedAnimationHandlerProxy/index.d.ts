import { VtkProxy } from '../../../macros';

/**
 * Minimal contract the proxy expects from the animation handler it drives,
 * as implemented by vtkTimeStepBasedAnimationHandler.
 */
export interface ITimeStepBasedAnimationHandler {
  setCurrentTimeStep(time: number): void;
  getTimeSteps(): number[];
}

export interface vtkTimeStepBasedAnimationHandlerProxy extends VtkProxy {
  setTime(time: number): void;

  /**
   * The time steps of the attached handler, or an empty list when no handler
   * is set.
   */
  getFrames(): number[];

  setInputAnimationHandler(handler: ITimeStepBasedAnimationHandler): void;

  getHandler(): ITimeStepBasedAnimationHandler | null;
  setHandler(handler: ITimeStepBasedAnimationHandler | null): boolean;
}

export interface ITimeStepBasedAnimationHandlerProxyInitialValues {
  handler?: ITimeStepBasedAnimationHandler | null;
}

export function newInstance(
  initialValues?: ITimeStepBasedAnimationHandlerProxyInitialValues
): vtkTimeStepBasedAnimationHandlerProxy;

/**
 * Animation proxy driving a time-step based animation handler: its frames are
 * the handler's time steps.
 */
declare const vtkTimeStepBasedAnimationHandlerProxy: {
  newInstance: typeof newInstance;
  extend: (
    publicAPI: object,
    model: object,
    initialValues?: ITimeStepBasedAnimationHandlerProxyInitialValues
  ) => void;
};
export default vtkTimeStepBasedAnimationHandlerProxy;
