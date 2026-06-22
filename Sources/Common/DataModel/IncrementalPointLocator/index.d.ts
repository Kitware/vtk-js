import vtkAbstractPointLocator, {
  IAbstractPointLocatorInitialValues,
} from '../AbstractPointLocator';

/**
 * Initial values for vtkIncrementalPointLocator.
 */
export interface IIncrementalPointLocatorInitialValues extends IAbstractPointLocatorInitialValues {}

export interface vtkIncrementalPointLocator extends vtkAbstractPointLocator {}

/**
 * Method used to decorate a given object (publicAPI+model) with
 * vtkIncrementalPointLocator characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IIncrementalPointLocatorInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IIncrementalPointLocatorInitialValues
): void;

/**
 * Method used to create a new instance of vtkIncrementalPointLocator.
 *
 * @param {IIncrementalPointLocatorInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IIncrementalPointLocatorInitialValues
): vtkIncrementalPointLocator;

/**
 * vtkIncrementalPointLocator is the abstract incremental insertion variant of
 * vtkAbstractPointLocator.
 */
export declare const vtkIncrementalPointLocator: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkIncrementalPointLocator;
