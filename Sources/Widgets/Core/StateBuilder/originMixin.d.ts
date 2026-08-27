import { Nullable, Vector3 } from '../../../types';
import { IDisplayScaleParams } from '../WidgetManager';
import { vtkWidgetState } from '../WidgetState';

export interface IOriginInitialValues {
  origin?: Nullable<Vector3>;
  /**
   * Optional offset added to the origin. When `getOrigin` is called with
   * display scale parameters, the offset is scaled to pixel screen space.
   */
  offset?: Nullable<Vector3>;
}

export interface vtkOriginMixinState extends vtkWidgetState {
  /**
   * Get a copy of the origin, with `offset` applied when one is set.
   *
   * @param {IDisplayScaleParams} [displayScaleParams] When provided, the offset
   * is scaled to pixel screen space instead of being added in world space.
   */
  getOrigin(displayScaleParams?: IDisplayScaleParams): Nullable<Vector3>;

  /**
   * Get the origin by reference. The `offset` is not applied.
   */
  getOriginByReference(): Nullable<Vector3>;

  /**
   * Set the origin.
   */
  setOrigin(origin: Vector3): boolean;
  setOrigin(x: number, y: number, z: number): boolean;

  /**
   * Set the origin.
   */
  setOriginFrom(origin: Vector3): void;

  /**
   * Get a copy of the offset.
   */
  getOffset(): Nullable<Vector3>;

  /**
   * Get the offset by reference.
   */
  getOffsetByReference(): Nullable<Vector3>;

  /**
   * Set the offset.
   */
  setOffset(offset: Vector3): boolean;
  setOffset(x: number, y: number, z: number): boolean;

  /**
   * Set the offset.
   */
  setOffsetFrom(offset: Vector3): void;

  /**
   * Translate the origin by the given delta.
   */
  translate(dx: number, dy: number, dz: number): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with an origin.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IOriginInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IOriginInitialValues
): void;

declare const vtkOriginMixin: {
  extend: typeof extend;
};

export default vtkOriginMixin;
