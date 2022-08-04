import { vtkObject } from "../../../interfaces";

/**
 *
 */
export interface ILocatorInitialValues {
	dataSet?: number[];
	maxLevel?: number;
	level?: number;
	automatic?: boolean;
	tolerance?: number;
	useExistingSearchStructure?: boolean;
}

export interface vtkLocator extends vtkObject {}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

/**
 * Method use to decorate a given object (publicAPI+model) with vtkLocator characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ILocatorInitialValues} [initialValues] (default: {})
 */
export function extend(
	publicAPI: object,
	model: object,
	initialValues?: ILocatorInitialValues
): void;

// ----------------------------------------------------------------------------

/**
 * vtkLocator
 */
export declare const vtkLocator: {
	extend: typeof extend;
};

export default vtkLocator;
