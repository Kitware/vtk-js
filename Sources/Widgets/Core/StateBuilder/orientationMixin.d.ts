import { Vector3 } from '../../../types';
import { vtkWidgetState } from '../WidgetState';

export interface IOrientationInitialValues {
  up?: Vector3;
  right?: Vector3;
  direction?: Vector3;
}

export interface vtkOrientationMixinState extends vtkWidgetState {
  /**
   * Get a copy of the up vector.
   */
  getUp(): Vector3;
  getUpByReference(): Vector3;
  setUp(up: Vector3): boolean;
  setUp(x: number, y: number, z: number): boolean;
  setUpFrom(up: Vector3): void;

  /**
   * Get a copy of the right vector.
   */
  getRight(): Vector3;
  getRightByReference(): Vector3;
  setRight(right: Vector3): boolean;
  setRight(x: number, y: number, z: number): boolean;
  setRightFrom(right: Vector3): void;

  /**
   * Get a copy of the direction vector.
   */
  getDirection(): Vector3;
  getDirectionByReference(): Vector3;
  setDirection(direction: Vector3): boolean;
  setDirection(x: number, y: number, z: number): boolean;
  setDirectionFrom(direction: Vector3): void;

  /**
   * Normalize the up, right and direction vectors.
   */
  normalize(): void;

  /**
   * Recompute an orthonormal frame from an origin and two points defining the
   * right and up directions.
   *
   * @param {Vector3} origin The frame origin
   * @param {Vector3} rightPoint A point along the right direction
   * @param {Vector3} upPoint A point along the up direction
   */
  updateFromOriginRightUp(
    origin: Vector3,
    rightPoint: Vector3,
    upPoint: Vector3
  ): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with an orthonormal
 * orientation frame.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IOrientationInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IOrientationInitialValues
): void;

declare const vtkOrientationMixin: {
  extend: typeof extend;
};

export default vtkOrientationMixin;
