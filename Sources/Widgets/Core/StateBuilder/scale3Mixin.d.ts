import { Vector3 } from '../../../types';
import { vtkWidgetState } from '../WidgetState';

export interface IScale3InitialValues {
  scale3?: Vector3;
}

export interface vtkScale3MixinState extends vtkWidgetState {
  /**
   * Get a copy of the per-axis scale.
   */
  getScale3(): Vector3;

  /**
   * Get the per-axis scale by reference.
   */
  getScale3ByReference(): Vector3;

  /**
   * Set the per-axis scale.
   */
  setScale3(scale: Vector3): boolean;
  setScale3(x: number, y: number, z: number): boolean;

  /**
   * Set the per-axis scale from an array.
   */
  setScale3From(scale: Vector3): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with a per-axis
 * scale.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IScale3InitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IScale3InitialValues
): void;

declare const vtkScale3Mixin: {
  extend: typeof extend;
};

export default vtkScale3Mixin;
