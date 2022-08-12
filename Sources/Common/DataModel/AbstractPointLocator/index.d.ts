import { vtkObject } from "../../../interfaces";
import { Bounds } from "../../../types";
import { ILocatorInitialValues } from "../Locator";

/**
 *
 */
export interface IAbstractPointLocatorInitialValues
	extends ILocatorInitialValues {
	bounds?: Bounds;
	numberOfBuckets: number;
}

export interface vtkAbstractPointLocator extends vtkObject {
	/**
	 * Set the bounds of this object.
	 * @param {Bounds} input
	 */
	setBounds(input: Bounds): void;

	/**
	 * Get the bounds of this object.
	 * @returns {Bounds}
	 */
	getBounds(): Bounds;
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
