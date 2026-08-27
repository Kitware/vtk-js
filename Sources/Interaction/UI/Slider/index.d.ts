import { vtkObject, vtkSubscription } from '../../../interfaces';
import { Nullable, Vector2 } from '../../../types';
import { SliderOrientation } from './Constants';

export interface ISliderInitialValues {
  orientation?: SliderOrientation;
  value?: number;
  values?: number[];
  /**
   * Distance between the first and the last of `values`.
   */
  range?: number;
  /**
   * [cursor size, track size] in pixels, recomputed on resize().
   */
  containerSizes?: Vector2;
  cursorStyle?: Partial<CSSStyleDeclaration>;
}

export interface vtkSlider extends vtkObject {
  getOrientation(): SliderOrientation;

  setOrientation(orientation: SliderOrientation): boolean;

  getValue(): number;

  getValues(): number[];

  /**
   * Attach the slider cursor to the given DOM element and bind the mouse
   * listeners on it. Passing null detaches and unbinds.
   * @param el
   */
  setContainer(el: Nullable<HTMLElement>): void;

  /**
   * Recompute the orientation and the cursor size from the container size.
   */
  resize(): void;

  /**
   * Move the cursor to the given value. The value is ignored when it falls
   * outside of the current values range.
   * @param {Number} v
   * @return true when the value changed
   */
  setValue(v: number): boolean;

  /**
   * Replace the set of values the cursor can snap to.
   * @param {Number[]} values
   */
  setValues(values: number[]): void;

  /**
   * Build `nbSteps` evenly spaced values between min and max and use them as
   * the slider values.
   * @param {Number} min
   * @param {Number} max
   * @param {Number} nbSteps
   */
  generateValues(min: number, max: number, nbSteps: number): void;

  /**
   * Merge the given CSS properties into the cursor style and apply them.
   * @param {Partial<CSSStyleDeclaration>} [cursorStyle]
   */
  updateCursorStyle(cursorStyle?: Partial<CSSStyleDeclaration>): void;

  invokeValueChange(value: number): void;

  onValueChange(
    cb: (value: number) => void,
    priority?: number
  ): vtkSubscription;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkSlider
 * characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ISliderInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ISliderInitialValues
): void;

/**
 * Method used to create a new instance of vtkSlider.
 * @param {ISliderInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: ISliderInitialValues): vtkSlider;

/**
 * vtkSlider is a DOM widget that draws a draggable cursor inside a container.
 * The cursor snaps to the closest of a discrete set of values and its
 * orientation follows the longest dimension of the container.
 */
export declare const vtkSlider: {
  newInstance: typeof newInstance;
  extend: typeof extend;
  SliderOrientation: typeof SliderOrientation;
};
export default vtkSlider;
