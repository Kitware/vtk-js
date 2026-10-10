import { EventHandler, vtkSubscription } from '../../../interfaces';
import { VtkProxy } from '../../../macros';
import { vtkAbstractAnimationProxy } from '../AbstractAnimationProxy';

export interface vtkAnimationProxyManager extends VtkProxy {
  /**
   * Register an animation and recompute the merged frame list. Registering
   * the same animation twice only adds a single entry.
   */
  addAnimation(animation: vtkAbstractAnimationProxy): void;

  /**
   * Play from the current frame, waiting between frames for the wall-clock
   * time separating them. Invokes `DonePlaying` once the last frame is shown.
   */
  play(): void;
  pause(): void;

  nextFrame(): void;
  previousFrame(): void;
  firstFrame(): void;
  lastFrame(): void;

  /**
   * Move every registered animation to the given frame and invoke
   * `CurrentFrameChanged`.
   */
  setFrameIndex(frameId: number): void;

  /**
   * Recompute the sorted, deduplicated list of frames from every registered
   * animation, then reset to the first frame.
   */
  updateFrames(): void;

  getCurrentFrame(): number;
  getFrames(): number[];
  getCurrentFrameIndex(): number;

  onCurrentFrameChanged(
    cb: EventHandler,
    priority?: number
  ): Readonly<vtkSubscription>;
  invokeCurrentFrameChanged(...args: unknown[]): void;

  onFramesChanged(
    cb: EventHandler,
    priority?: number
  ): Readonly<vtkSubscription>;
  invokeFramesChanged(...args: unknown[]): void;

  onDonePlaying(cb: EventHandler, priority?: number): Readonly<vtkSubscription>;
  invokeDonePlaying(...args: unknown[]): void;
}

export function newInstance(initialValues?: object): vtkAnimationProxyManager;

/**
 * Aggregates animation proxies into a single timeline and plays through the
 * union of their frames.
 */
declare const vtkAnimationProxyManager: {
  newInstance: typeof newInstance;
  extend: (publicAPI: object, model: object, initialValues?: object) => void;
};
export default vtkAnimationProxyManager;
