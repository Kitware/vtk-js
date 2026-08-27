import { VtkProxy } from '../../../macros';

export interface vtkAbstractAnimationProxy extends VtkProxy {
  /**
   * Move the animation to the given time. The base class does nothing;
   * concrete animation proxies forward the time to their handler.
   */
  setTime(time: number): void;

  /**
   * List the times at which this animation has a frame. The base class
   * always returns an empty list.
   */
  getFrames(): number[];
}

export function newInstance(initialValues?: object): vtkAbstractAnimationProxy;

/**
 * Base class for animation proxies: an object that can report the times it
 * can be rendered at and that can be moved to one of those times.
 */
declare const vtkAbstractAnimationProxy: {
  newInstance: typeof newInstance;
  extend: (publicAPI: object, model: object, initialValues?: object) => void;
};
export default vtkAbstractAnimationProxy;
