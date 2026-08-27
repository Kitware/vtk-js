import { Bounds, Vector3 } from '../../../types';
import { vtkWidgetState } from '../WidgetState';

export interface IBoundsInitialValues {
  bounds?: Bounds;
  placeFactor?: number;
}

export interface vtkBoundsMixinState extends vtkWidgetState {
  /**
   * Get a copy of the (place-factor scaled) bounds.
   */
  getBounds(): Bounds;

  /**
   * Get the (place-factor scaled) bounds by reference.
   */
  getBoundsByReference(): Bounds;

  /**
   * Set the bounds.
   */
  setBounds(bounds: Bounds): boolean;
  setBounds(
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    zMin: number,
    zMax: number
  ): boolean;

  /**
   * Set the bounds by reference.
   */
  setBoundsFrom(bounds: Bounds): void;

  /**
   * Get the factor by which the bounds passed to `placeWidget` are scaled
   * around their center.
   */
  getPlaceFactor(): number;

  /**
   * Set the place factor and re-apply it to the bounds last given to
   * `placeWidget`.
   *
   * @param {Number} factor The scaling factor
   */
  setPlaceFactor(factor: number): void;

  /**
   * Scale the given bounds by the place factor and store them as the state
   * bounds. Invokes the `BoundsChange` event.
   *
   * @param {Bounds} bounds The bounds to place the widget on
   */
  placeWidget(bounds: Bounds): void;

  /**
   * Test whether a point lies inside the current bounds.
   */
  containsPoint(point: Vector3): boolean;
  containsPoint(x: number, y: number, z: number): boolean;

  /**
   * Register a callback invoked whenever the bounds change.
   */
  onBoundsChange(cb: (bounds: Bounds) => void): Readonly<{
    unsubscribe: () => void;
  }>;

  /**
   * Invoke the `BoundsChange` event.
   */
  invokeBoundsChange(bounds: Bounds): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with bounds
 * characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IBoundsInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IBoundsInitialValues
): void;

declare const vtkBoundsMixin: {
  extend: typeof extend;
};

export default vtkBoundsMixin;
