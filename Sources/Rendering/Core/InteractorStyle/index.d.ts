import { EventHandler, vtkSubscription } from '../../../interfaces';
import vtkInteractorObserver from '../InteractorObserver';

export interface vtkInteractorStyle extends vtkInteractorObserver {
  /**
   * Start a Rotate event.
   */
  startRotate(): void;

  /**
   * Invoke a StartRotate event.
   */
  invokeStartRotateEvent(...args: unknown[]): void;

  /**
   * Registers a callback on a StartRotate event.
   */
  onStartRotateEvent(cb: EventHandler, priority?: number): vtkSubscription;

  /**
   * Ends a Rotate event.
   */
  endRotate(): void;

  /**
   * Invoke an EndRotate event.
   */
  invokeEndRotateEvent(...args: unknown[]): void;

  /**
   * Registers a callback on an EndRotate event.
   */
  onEndRotateEvent(cb: EventHandler, priority?: number): vtkSubscription;
  /**
   * Start a Pan event.
   */
  startPan(): void;

  /**
   * Invoke a StartPan event.
   */
  invokeStartPanEvent(...args: unknown[]): void;

  /**
   * Registers a callback on a StartPan event.
   */
  onStartPanEvent(cb: EventHandler, priority?: number): vtkSubscription;

  /**
   * Ends a Pan event.
   */
  endPan(): void;

  /**
   * Invoke an EndPan event.
   */
  invokeEndPanEvent(...args: unknown[]): void;

  /**
   * Registers a callback on an EndPan event.
   */
  onEndPanEvent(cb: EventHandler, priority?: number): vtkSubscription;
  /**
   * Start a Spin event.
   */
  startSpin(): void;

  /**
   * Invoke a StartSpin event.
   */
  invokeStartSpinEvent(...args: unknown[]): void;

  /**
   * Registers a callback on a StartSpin event.
   */
  onStartSpinEvent(cb: EventHandler, priority?: number): vtkSubscription;

  /**
   * Ends a Spin event.
   */
  endSpin(): void;

  /**
   * Invoke an EndSpin event.
   */
  invokeEndSpinEvent(...args: unknown[]): void;

  /**
   * Registers a callback on an EndSpin event.
   */
  onEndSpinEvent(cb: EventHandler, priority?: number): vtkSubscription;
  /**
   * Start a Dolly event.
   */
  startDolly(): void;

  /**
   * Invoke a StartDolly event.
   */
  invokeStartDollyEvent(...args: unknown[]): void;

  /**
   * Registers a callback on a StartDolly event.
   */
  onStartDollyEvent(cb: EventHandler, priority?: number): vtkSubscription;

  /**
   * Ends a Dolly event.
   */
  endDolly(): void;

  /**
   * Invoke an EndDolly event.
   */
  invokeEndDollyEvent(...args: unknown[]): void;

  /**
   * Registers a callback on an EndDolly event.
   */
  onEndDollyEvent(cb: EventHandler, priority?: number): vtkSubscription;
  /**
   * Start a CameraPose event.
   */
  startCameraPose(): void;

  /**
   * Invoke a StartCameraPose event.
   */
  invokeStartCameraPoseEvent(...args: unknown[]): void;

  /**
   * Registers a callback on a StartCameraPose event.
   */
  onStartCameraPoseEvent(cb: EventHandler, priority?: number): vtkSubscription;

  /**
   * Ends a CameraPose event.
   */
  endCameraPose(): void;

  /**
   * Invoke an EndCameraPose event.
   */
  invokeEndCameraPoseEvent(...args: unknown[]): void;

  /**
   * Registers a callback on an EndCameraPose event.
   */
  onEndCameraPoseEvent(cb: EventHandler, priority?: number): vtkSubscription;
  /**
   * Start a WindowLevel event.
   */
  startWindowLevel(): void;

  /**
   * Invoke a StartWindowLevel event.
   */
  invokeStartWindowLevelEvent(...args: unknown[]): void;

  /**
   * Registers a callback on a StartWindowLevel event.
   */
  onStartWindowLevelEvent(cb: EventHandler, priority?: number): vtkSubscription;

  /**
   * Ends a WindowLevel event.
   */
  endWindowLevel(): void;

  /**
   * Invoke an EndWindowLevel event.
   */
  invokeEndWindowLevelEvent(...args: unknown[]): void;

  /**
   * Registers a callback on an EndWindowLevel event.
   */
  onEndWindowLevelEvent(cb: EventHandler, priority?: number): vtkSubscription;
  /**
   * Start a Slice event.
   */
  startSlice(): void;

  /**
   * Invoke a StartSlice event.
   */
  invokeStartSliceEvent(...args: unknown[]): void;

  /**
   * Registers a callback on a StartSlice event.
   */
  onStartSliceEvent(cb: EventHandler, priority?: number): vtkSubscription;

  /**
   * Ends a Slice event.
   */
  endSlice(): void;

  /**
   * Invoke an EndSlice event.
   */
  invokeEndSliceEvent(...args: unknown[]): void;

  /**
   * Registers a callback on an EndSlice event.
   */
  onEndSliceEvent(cb: EventHandler, priority?: number): vtkSubscription;

  /**
   * Handles a keypress.
   */
  handleKeyPress(callData: unknown): void;
}

export interface IInteractorStyleInitialValues {
  autoAdjustCameraClippingRange?: boolean;
}

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IInteractorStyleInitialValues
): void;

export const vtkInteractorStyle: {
  extend: typeof extend;
};

export default vtkInteractorStyle;
