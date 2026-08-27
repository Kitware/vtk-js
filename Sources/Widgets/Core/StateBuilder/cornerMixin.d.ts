import { Vector3 } from '../../../types';
import { vtkWidgetState } from '../WidgetState';

export interface ICornerInitialValues {
  corner?: Vector3;
}

export interface vtkCornerMixinState extends vtkWidgetState {
  /**
   * Get a copy of the corner position.
   */
  getCorner(): Vector3;

  /**
   * Get the corner position by reference.
   */
  getCornerByReference(): Vector3;

  /**
   * Set the corner position.
   */
  setCorner(corner: Vector3): boolean;
  setCorner(x: number, y: number, z: number): boolean;

  /**
   * Set the corner position from an array.
   */
  setCornerFrom(corner: Vector3): void;

  /**
   * Translate the corner by the given delta.
   */
  translate(dx: number, dy: number, dz: number): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with a corner
 * position.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ICornerInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ICornerInitialValues
): void;

declare const vtkCornerMixin: {
  extend: typeof extend;
};

export default vtkCornerMixin;
