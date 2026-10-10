import vtkInteractorStyle, {
  IInteractorStyleInitialValues,
} from '../../../Rendering/Core/InteractorStyle';
import { vtkSubscription } from '../../../interfaces';

/**
 * Mouse state forwarded to the remote peer. Positions are normalized against
 * the view size. The button and modifier flags are 0 or 1. Any extra field of
 * `remoteEventAddOn` is merged in.
 */
export interface IRemoteMouseEvent {
  action: 'down' | 'up';
  x: number;
  y: number;
  buttonLeft: number;
  buttonMiddle: number;
  buttonRight: number;
  shiftKey: number;
  altKey: number;
  ctrlKey: number;
  metaKey: number;
  [key: string]: unknown;
}

export interface IRemoteWheelEvent extends Partial<IRemoteMouseEvent> {
  type: 'StartMouseWheel' | 'MouseWheel' | 'EndMouseWheel';
  spinY?: number;
}

export interface IRemoteGestureEvent {
  type:
    | 'StartPinch'
    | 'Pinch'
    | 'EndPinch'
    | 'StartRotate'
    | 'Rotate'
    | 'EndRotate'
    | 'StartPan'
    | 'Pan'
    | 'EndPan';
  scale?: number;
  rotation?: number;
  translation?: { x: number; y: number };
  [key: string]: unknown;
}

export interface vtkInteractorStyleRemoteMouse extends vtkInteractorStyle {
  /**
   * @param callData event data
   */
  handleLeftButtonPress(callData: unknown): void;

  /**
   * @param callData event data
   */
  handleMiddleButtonPress(callData: unknown): void;

  /**
   * @param callData event data
   */
  handleRightButtonPress(callData: unknown): void;

  /**
   * @param callData event data
   */
  handleLeftButtonRelease(callData: unknown): void;

  /**
   * @param callData event data
   */
  handleMiddleButtonRelease(callData: unknown): void;

  /**
   * @param callData event data
   */
  handleRightButtonRelease(callData: unknown): void;

  /**
   * @param callData event data
   */
  handleMouseMove(callData: unknown): void;

  /**
   * @param callData event data
   */
  handleStartMouseWheel(callData: unknown): void;

  /**
   * @param callData event data
   */
  handleMouseWheel(callData: unknown): void;

  /**
   * @param callData event data
   */
  handleStartPinch(callData: unknown): void;

  /**
   * @param callData event data
   */
  handlePinch(callData: unknown): void;

  /**
   * @param callData event data
   */
  handleStartRotate(callData: unknown): void;

  /**
   * @param callData event data
   */
  handleRotate(callData: unknown): void;

  /**
   * @param callData event data
   */
  handleStartPan(callData: unknown): void;

  /**
   * @param callData event data
   */
  handlePan(callData: unknown): void;

  handleEndMouseWheel(): void;

  handleEndPinch(): void;

  handleEndRotate(): void;

  handleEndPan(): void;
  /**
   * Handles a button down event.
   * @param button which button
   * @param callData event data
   */
  onButtonDown(button: number, callData: unknown): void;

  /**
   * Handles a button up event.
   * @param button which button
   * @param callData event data
   */
  onButtonUp(button: number, callData: unknown): void;

  invokeRemoteMouseEvent(event: IRemoteMouseEvent): void;
  onRemoteMouseEvent(
    cb: (event: IRemoteMouseEvent) => void,
    priority?: number
  ): vtkSubscription;

  invokeRemoteWheelEvent(event: IRemoteWheelEvent): void;
  onRemoteWheelEvent(
    cb: (event: IRemoteWheelEvent) => void,
    priority?: number
  ): vtkSubscription;

  invokeRemoteGestureEvent(event: IRemoteGestureEvent): void;
  onRemoteGestureEvent(
    cb: (event: IRemoteGestureEvent) => void,
    priority?: number
  ): vtkSubscription;

  /**
   * Gets whether mouse moves are forwarded even when no button is pressed.
   */
  getSendMouseMove(): boolean;

  /**
   * Sets whether mouse moves are forwarded even when no button is pressed.
   * @param sendMouseMove
   */
  setSendMouseMove(sendMouseMove: boolean): boolean;

  /**
   * Gets the extra fields merged into every forwarded event.
   */
  getRemoteEventAddOn(): object | undefined;

  /**
   * Sets the extra fields merged into every forwarded event.
   * @param remoteEventAddOn
   */
  setRemoteEventAddOn(remoteEventAddOn: object): boolean;

  /**
   * Gets the minimum delay, in milliseconds, between two forwarded mouse
   * moves.
   */
  getThrottleDelay(): number;

  /**
   * Sets the minimum delay, in milliseconds, between two forwarded mouse
   * moves.
   * @param throttleDelay
   */
  setThrottleDelay(throttleDelay: number): boolean;

  /**
   * Gets the minimum delay, in milliseconds, between two forwarded wheel
   * events. Zero disables throttling.
   */
  getWheelThrottleDelay(): number;

  /**
   * Sets the minimum delay, in milliseconds, between two forwarded wheel
   * events. Zero disables throttling.
   * @param wheelThrottleDelay
   */
  setWheelThrottleDelay(wheelThrottleDelay: number): boolean;
}

export interface IInteractorStyleRemoteMouseInitialValues extends IInteractorStyleInitialValues {
  sendMouseMove?: boolean;
  remoteEventAddOn?: object;
  throttleDelay?: number;
  wheelThrottleDelay?: number;
}

export function newInstance(
  initialValues?: IInteractorStyleRemoteMouseInitialValues
): vtkInteractorStyleRemoteMouse;

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IInteractorStyleRemoteMouseInitialValues
): void;

/**
 * Interactor style that does not act on the local camera but re-emits mouse,
 * wheel and gesture interactions as events meant to be forwarded to a remote
 * renderer.
 */
export declare const vtkInteractorStyleRemoteMouse: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkInteractorStyleRemoteMouse;
