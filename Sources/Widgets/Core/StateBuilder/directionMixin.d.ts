import { Vector3 } from '../../../types';
import { vtkWidgetState } from '../WidgetState';

export interface IDirectionInitialValues {
  direction?: Vector3;

  /**
   * The unit the `rotate*` angles are expressed in. Anything other than
   * `'degree'` is treated as radians.
   * @default 'radian'
   */
  angleUnit?: 'degree' | 'radian';
}

export interface vtkDirectionMixinState extends vtkWidgetState {
  /**
   * Get a copy of the direction.
   */
  getDirection(): Vector3;

  /**
   * Get the direction by reference.
   */
  getDirectionByReference(): Vector3;

  /**
   * Set the direction.
   */
  setDirection(direction: Vector3): boolean;
  setDirection(x: number, y: number, z: number): boolean;

  /**
   * Set the direction from an existing array without triggering a modified event.
   */
  setDirectionFrom(direction: Vector3): void;

  /**
   * Rotate the direction by the rotation taking `originDirection` onto
   * `targetDirection`.
   */
  rotateFromDirections(
    originDirection: Vector3,
    targetDirection: Vector3
  ): void;

  /**
   * Rotate the direction around an arbitrary axis.
   *
   * @param {Number} angle The angle, in the unit given by the state `angleUnit`
   * @param {Vector3} axis The rotation axis
   */
  rotate(angle: number, axis: Vector3): void;

  /**
   * Rotate the direction around the X axis.
   */
  rotateX(angle: number): void;

  /**
   * Rotate the direction around the Y axis.
   */
  rotateY(angle: number): void;

  /**
   * Rotate the direction around the Z axis.
   */
  rotateZ(angle: number): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with a direction.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IDirectionInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IDirectionInitialValues
): void;

declare const vtkDirectionMixin: {
  extend: typeof extend;
};

export default vtkDirectionMixin;
