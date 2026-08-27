import { vtkObject } from '../../../interfaces';
import { Bounds, Nullable } from '../../../types';
import vtkLocator, { ILocatorInitialValues } from '../Locator';

/**
 *
 */
export interface IAbstractPointLocatorInitialValues extends ILocatorInitialValues {
  bounds?: Bounds;
  numberOfBuckets?: number;
}

export interface vtkAbstractPointLocator extends vtkLocator {
  /**
   * Set the bounds of this object.
   * @param {Bounds} input
   */
  setBounds(input: Bounds): boolean;

  /**
   * Set the bounds of this object by reference.
   * @param {Bounds} bounds
   */
  setBoundsFrom(bounds: Bounds): void;

  /**
   * Get the bounds of this object.
   * @returns {Bounds}
   */
  getBounds(): Nullable<Bounds>;

  /**
   * Get the bounds of this object by reference.
   * @returns {Bounds}
   */
  getBoundsByReference(): Nullable<Bounds>;

  /**
   * Get the number of buckets (divisions) currently used by the search
   * structure.
   *
   * @returns {Number} The number of buckets.
   */
  getNumberOfBuckets(): number;
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

/**
 * Method use to decorate a given object (publicAPI+model) with vtkAbstractPointLocator characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IAbstractPointLocatorInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IAbstractPointLocatorInitialValues
): void;

// ----------------------------------------------------------------------------

/**
 * vtkAbstractPointLocator
 */
export declare const vtkAbstractPointLocator: {
  extend: typeof extend;
};

export default vtkAbstractPointLocator;
